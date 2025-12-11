/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type GetContentFn = (args: { format: 'html' }) => string;
export const editorUtils = {
	calculateScrollTop: (editViewWrapper: HTMLElement): { position: number } => {
		const editViewWrapperPrevScrollTop = editViewWrapper?.scrollTop;
		return { position: editViewWrapperPrevScrollTop ?? 0 };
	},

	computeUsedCids: (editor: { getContent: GetContentFn }): { usedCids: Array<string> } => {
		const content = editor.getContent({ format: 'html' });
		const parser = new DOMParser();
		const doc = parser.parseFromString(content, 'text/html');
		const usedCids = [
			...Array.from(doc.querySelectorAll('img[pnsrc]')).map((img) => img.getAttribute('pnsrc')),
			...Array.from(doc.querySelectorAll('img[src^="cid:"]')).map((img) => img.getAttribute('src'))
		].filter((cid): cid is string => Boolean(cid));
		return {
			usedCids
		};
	}
};
