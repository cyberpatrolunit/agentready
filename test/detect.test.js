import { describe, it, expect } from 'vitest';
import { detect } from '../public/lib/detect.js';

const nextPkg = JSON.stringify({
  name: 'acme-web',
  packageManager: 'pnpm@9.1.0',
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'eslint .',
    test: 'vitest run',
    typecheck: 'tsc --noEmit',
  },
  dependencies: { next: '15.1.0', react: '19.0.0', 'react-dom': '19.0.0' },
  devDependencies: {
    typescript: '^5.6.0',
    vitest: '^3.0.0',
    eslint: '^9.0.0',
    prettier: '^3.3.0',
  },
});

const pyproject = `
[project]
name = "acme-api"
version = "0.1.0"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "pydantic>=2.8",
]

[dependency-groups]
dev = ["pytest>=8.0", "ruff>=0.6"]

[tool.ruff]
line-length = 100

[tool.pytest.ini_options]
testpaths = ["tests"]
`;

const cargoToml = `
[package]
name = "acme-server"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
`;

const goMod = `module github.com/acme/acme-svc

go 1.23

require (
\tgithub.com/gin-gonic/gin v1.10.0
\tgithub.com/stretchr/testify v1.9.0
)
`;

describe('detect: node/next', () => {
  const p = detect([{ name: 'package.json', content: nextPkg }]);

  it('identifies project name and typescript', () => {
    expect(p.projectName).toBe('acme-web');
    expect(p.typescript).toBe(true);
    expect(p.languages).toContain('typescript');
  });

  it('identifies pnpm from packageManager field', () => {
    expect(p.packageManager).toBe('pnpm');
  });

  it('identifies next framework and tooling', () => {
    expect(p.frameworks).toContain('next');
    expect(p.testRunner).toBe('vitest');
    expect(p.linter).toBe('eslint');
    expect(p.formatter).toBe('prettier');
  });

  it('resolves commands from scripts', () => {
    expect(p.commands.dev).toBe('pnpm dev');
    expect(p.commands.build).toBe('pnpm build');
    expect(p.commands.test).toBe('pnpm test');
    expect(p.commands.typecheck).toBe('pnpm typecheck');
    expect(p.commands.install).toBe('pnpm install');
  });
});

describe('detect: python/fastapi with uv-style pyproject', () => {
  const p = detect([{ name: 'pyproject.toml', content: pyproject }]);

  it('identifies language, name, framework', () => {
    expect(p.languages).toContain('python');
    expect(p.projectName).toBe('acme-api');
    expect(p.frameworks).toContain('fastapi');
  });

  it('identifies pytest and ruff', () => {
    expect(p.testRunner).toBe('pytest');
    expect(p.linter).toBe('ruff');
  });
});

describe('detect: rust/axum', () => {
  const p = detect([{ name: 'Cargo.toml', content: cargoToml }]);

  it('identifies rust, name, axum', () => {
    expect(p.languages).toContain('rust');
    expect(p.projectName).toBe('acme-server');
    expect(p.frameworks).toContain('axum');
    expect(p.commands.test).toBe('cargo test');
  });
});

describe('detect: go/gin', () => {
  const p = detect([{ name: 'go.mod', content: goMod }]);

  it('identifies go, module name, gin', () => {
    expect(p.languages).toContain('go');
    expect(p.projectName).toBe('acme-svc');
    expect(p.frameworks).toContain('gin');
    expect(p.commands.test).toBe('go test ./...');
  });
});

describe('detect: lockfile-based package manager', () => {
  it('uses pnpm-lock.yaml presence', () => {
    const p = detect([
      { name: 'package.json', content: JSON.stringify({ name: 'x', dependencies: { react: '18' } }) },
      { name: 'pnpm-lock.yaml', content: '' },
    ]);
    expect(p.packageManager).toBe('pnpm');
  });

  it('defaults to npm when nothing indicates otherwise', () => {
    const p = detect([{ name: 'package.json', content: JSON.stringify({ name: 'x' }) }]);
    expect(p.packageManager).toBe('npm');
  });
});

describe('detect: multi-language repos', () => {
  it('merges profiles', () => {
    const p = detect([
      { name: 'package.json', content: nextPkg },
      { name: 'pyproject.toml', content: pyproject },
    ]);
    expect(p.languages).toEqual(expect.arrayContaining(['typescript', 'python']));
    expect(p.frameworks).toEqual(expect.arrayContaining(['next', 'fastapi']));
  });
});

describe('detect: graceful degradation', () => {
  it('handles invalid JSON without throwing', () => {
    const p = detect([{ name: 'package.json', content: '{ nope' }]);
    expect(p.notes.join(' ')).toMatch(/could not be parsed/i);
    expect(p.languages).toContain('javascript');
  });

  it('handles empty input', () => {
    const p = detect([]);
    expect(p.languages).toEqual([]);
    expect(p.projectName).toBe(null);
  });
});

describe('detect: .cursorrules import', () => {
  it('captures cursorrules content as imported rules', () => {
    const p = detect([
      { name: 'package.json', content: JSON.stringify({ name: 'x', dependencies: { react: '18' } }) },
      { name: '.cursorrules', content: 'Always use functional components.\nPrefer named exports.' },
    ]);
    expect(p.importedRules).toContain('functional components');
  });
});

describe('detect: java maven spring boot', () => {
  const pom = `<?xml version="1.0"?>
<project>
  <artifactId>example-service</artifactId>
  <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId></parent>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
  </dependencies>
</project>`;
  const p = detect([{ name: 'pom.xml', content: pom }]);
  it('identifies java, maven, spring boot', () => {
    expect(p.languages).toContain('java');
    expect(p.frameworks).toContain('spring-boot');
    expect(p.commands.test).toContain('mvn');
    expect(p.projectName).toBe('example-service');
  });
});

describe('detect: gradle spring boot', () => {
  const gradle = `plugins { id 'org.springframework.boot' version '3.3.0' }
dependencies { implementation 'org.springframework.boot:spring-boot-starter-web' }`;
  const p = detect([{ name: 'build.gradle', content: gradle }]);
  it('identifies java + gradle + spring boot', () => {
    expect(p.languages).toContain('java');
    expect(p.frameworks).toContain('spring-boot');
    expect(p.commands.test).toBe('./gradlew test');
  });
});

describe('detect: dotnet csproj', () => {
  const csproj = `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup><TargetFramework>net9.0</TargetFramework></PropertyGroup>
  <ItemGroup><PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" /></ItemGroup>
</Project>`;
  const p = detect([{ name: 'Example.Api.csproj', content: csproj }]);
  it('identifies csharp + aspnet', () => {
    expect(p.languages).toContain('csharp');
    expect(p.frameworks).toContain('aspnet');
    expect(p.commands.test).toBe('dotnet test');
  });
});
