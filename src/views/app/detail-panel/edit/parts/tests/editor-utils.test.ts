/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { describe } from 'vitest';

import { editorUtils } from '../editor-utils';

describe('Editor utils', () => {
	describe('Calculate scroll top', () => {
		it('maintains scroll position', () => {
			const parent = document.createElement('div');
			parent.scrollTop = 42;

			expect(editorUtils.calculateScrollTop(parent).position).toBe(42);
		});
		it('returns 0 scroll position when scroll top not defined', () => {
			const parent = document.createElement('div');

			expect(editorUtils.calculateScrollTop(parent).position).toBe(0);
		});
	});
	describe('Cids', () => {
		it('returns used Cids referenced in the html content', () => {
			const htmlContent =
				'<p><img pnsrc="cid:first" src="cid:first" />' +
				'<img src="cid:second" />' +
				'<img src="https://test.test/image.png" /></p>';
			const { usedCids } = editorUtils.retrieveCIdsFromContent({ htmlContent });
			expect(usedCids).toEqual(['cid:first', 'cid:second']);
		});
	});
});
