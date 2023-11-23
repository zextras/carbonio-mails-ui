/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { GenericActionDescriptors } from '../../constants';
import {
	getSelectFoldersUIAction,
	mergeDefaultExecutionConfig,
	SelectFoldersUIActionExecutionConfig
} from '../select-folders';

describe('mergeDefaultExecutionConfig', () => {
	it('returns the default values if no values are provided', () => {
		const config: Partial<SelectFoldersUIActionExecutionConfig> = {};
		const result = mergeDefaultExecutionConfig(config);
		expect(result).toEqual(
			expect.objectContaining({
				confirmActionLabel: 'label.select_folder',
				showSharedAccounts: true,
				showThrashFolder: false,
				showSpamFolder: false,
				allowRootSelection: true,
				allowFolderCreation: false,
				title: 'label.select_folder',
				hintText: '',
				confirmActionTooltip: '',
				disabledConfirmActionTooltip: 'label.no_folder_selected'
			})
		);
	});

	it('returns the provided values', () => {
		const config: Partial<SelectFoldersUIActionExecutionConfig> = {
			confirmActionLabel: 'confirm action label string',
			showSharedAccounts: false,
			showThrashFolder: false,
			showSpamFolder: false,
			allowRootSelection: false,
			allowFolderCreation: true,
			title: 'title string',
			hintText: 'dummy hint text',
			confirmActionTooltip: 'confirm action tooltip',
			disabledConfirmActionTooltip: 'disabled confirm action tooltip'
		};
		const result = mergeDefaultExecutionConfig(config);
		expect(result).toEqual(
			expect.objectContaining({
				confirmActionLabel: 'confirm action label string',
				showSharedAccounts: false,
				showThrashFolder: false,
				showSpamFolder: false,
				allowRootSelection: false,
				allowFolderCreation: true,
				title: 'title string',
				hintText: 'dummy hint text',
				confirmActionTooltip: 'confirm action tooltip',
				disabledConfirmActionTooltip: 'disabled confirm action tooltip'
			})
		);
	});
});

describe('getSelectFoldersUIAction', () => {
	it('returns an action with the correct id', () => {
		const action = getSelectFoldersUIAction();
		expect(action.id).toEqual(GenericActionDescriptors.SELECT_FOLDERS.id);
	});
});
