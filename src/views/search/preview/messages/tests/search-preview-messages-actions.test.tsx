/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { setSearchResultsByMessage } from '../../../../../store/zustand/search/store';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { ExtraWindowCreationParams, ExtraWindowsCreationResult } from '../../../../../types';
import { previewMessageOnSeparatedWindow } from '../search-preview-messages-actions';

describe('Preview message on new window', () => {
	it('should call create window with correct parameters', () => {
		setSearchResultsByMessage([generateMessage({ id: '1' })], false);
		let spyParams: Partial<ExtraWindowCreationParams> = {};
		const spyCreateWindow = (props: ExtraWindowCreationParams): ExtraWindowsCreationResult => {
			spyParams = props;
			return { id: '1' };
		};

		previewMessageOnSeparatedWindow('1', 'Test subject', spyCreateWindow, []);

		expect(spyParams.name).toBe('message-1');
		expect(spyParams.title).toBe('Test subject');
		expect(spyParams.closeOnUnmount).toBe(false);
		expect(spyParams.returnComponent).toBe(false);
		// NOTE: we can also test the UI by using spyParams.children
	});
});
