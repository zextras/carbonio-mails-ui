/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MessageActionsDescriptors } from '../../../../../constants';
import { setSearchResultsByMessage } from '../../../../../store/zustand/search/store';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { ExtraWindowCreationParams, ExtraWindowsCreationResult } from '../../../../../types';
import {
	previewMessageOnSeparatedWindow,
	previewMessageOnSeparatedWindowAction
} from '../search-preview-messages-actions';

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

	it('should return an action with id "preview on separate window"', () => {
		const result = previewMessageOnSeparatedWindowAction('1', '', jest.fn(), []);

		expect(result.id).toBe(MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW.id);
	});

	it('should call create window when calling onClick', () => {
		const onClickAction = jest.fn();
		const result = previewMessageOnSeparatedWindowAction('1', '', onClickAction, []);

		result.onClick();

		expect(onClickAction).toBeCalledTimes(1);
	});
});
