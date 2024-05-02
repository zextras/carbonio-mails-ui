/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addSettingsView } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import * as advancedAccount from '../../api/advanced-account';
import { setupShellComponents } from '../setup-shell-components';

function mockAdvancedAccountAPI(store: { backupSelfUndeleteAllowed: boolean }): void {
	jest
		.spyOn(advancedAccount, 'advancedAccountAPI')
		.mockImplementation(() => Promise.resolve({ ...store, updateBackupSelfUndeleteAllowed: noop }));
}

describe('setupShellComponents', () => {
	it('should not render Recover Messages menu item when backupSelfUndeleteAllowed is false', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: false });

		await setupShellComponents();

		expect(addSettingsView).toBeCalledWith(
			expect.objectContaining({
				subSections: [
					{ id: 'displaying_messages', label: 'settings.label.display_messages' },
					{ id: 'receiving_messages', label: 'label.receive_message' },
					{ id: 'signatures', label: 'signatures.signature_heading' },
					{ id: 'using_signatures', label: 'label.using_signatures' },
					{ id: 'filters', label: 'filters.filters' }
				]
			})
		);
	});
	it('should render Recover Messages menu item when backupSelfUndeleteAllowed is true ', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: true });

		await setupShellComponents();

		expect(addSettingsView).toBeCalledWith(
			expect.objectContaining({
				subSections: [
					{ id: 'displaying_messages', label: 'settings.label.display_messages' },
					{ id: 'receiving_messages', label: 'label.receive_message' },
					{ id: 'recover_messages', label: 'label.recover_messages' },
					{ id: 'signatures', label: 'signatures.signature_heading' },
					{ id: 'using_signatures', label: 'label.using_signatures' },
					{ id: 'filters', label: 'filters.filters' }
				]
			})
		);
	});
});
