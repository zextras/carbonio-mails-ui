/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { GenericActionDescriptors } from '../../constants';
import { getSelectFoldersUIAction } from '../select-folders';

describe('getSelectFoldersUIAction', () => {
	it('returns an action with the correct id', () => {
		const action = getSelectFoldersUIAction();
		expect(action.id).toEqual(GenericActionDescriptors.SELECT_FOLDERS.id);
	});
});
