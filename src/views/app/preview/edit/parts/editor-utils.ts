/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const editorUtils = {
	calculateScrollTop: (editViewWrapper: HTMLElement): { position: number } => {
		const editViewWrapperPrevScrollTop = editViewWrapper?.scrollTop;
		return { position: editViewWrapperPrevScrollTop ?? 0 };
	},

	retrieveCIdsFromContent: ({
		htmlContent
	}: {
		htmlContent: string;
	}): { usedCids: Array<string> } => {
		const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
		// collect all used attachment IDs
		const usedCids = Array.from(doc.querySelectorAll('img[data-pnsrc], img[src^="cid:"]'))
			.map((img) => img.getAttribute('data-pnsrc') || img.getAttribute('src'))
			.filter((cid): cid is string => Boolean(cid));
		return {
			usedCids
		};
	}
};
