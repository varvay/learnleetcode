export type Folder = `problems/${string}` | `utilities/${string}`;

export interface SourceFile {
	name: string;
	code: string;
	language: string;
}

const rawFiles = import.meta.glob<string>(
	['/problems/*/*', '/utilities/*/*', '!/*/*/index.md', '!/*/*/explainer.tsx'],
	{ query: '?raw', import: 'default', eager: true },
);

const explainerPaths = Object.keys(import.meta.glob(['/problems/*/explainer.tsx', '/utilities/*/explainer.tsx']));

const languagesByExtension: Record<string, string> = {
	py: 'python',
	js: 'javascript',
	ts: 'typescript',
	java: 'java',
	kt: 'kotlin',
	cpp: 'cpp',
	c: 'c',
	cs: 'csharp',
	go: 'go',
	rs: 'rust',
	swift: 'swift',
	rb: 'ruby',
	sql: 'sql',
	sh: 'bash',
};

export function sourceFilesIn(folder: Folder): SourceFile[] {
	return Object.entries(rawFiles)
		.filter(([path]) => path.startsWith(`/${folder}/`))
		.map(([path, code]) => {
			const name = path.split('/').pop()!;
			const extension = name.split('.').pop()!;
			return { name, code, language: languagesByExtension[extension] ?? 'plaintext' };
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

export const hasExplainer = (folder: Folder) => explainerPaths.includes(`/${folder}/explainer.tsx`);
