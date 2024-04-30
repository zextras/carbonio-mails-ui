/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addSettingsView } from '@zextras/carbonio-shell-ui';

import { mockAdvancedAccountAPI } from '../../tests/utils';
import { addShellComponents } from '../add-shell-components';

describe('addShellComponents', () => {
	it('should not render Recover Messages menu item when backupSelfUndeleteAllowed is false', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: false });

		await addShellComponents();

		expect(addSettingsView).toBeCalledWith(
			expect.objectContaining({
				route: 'mails',
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

		await addShellComponents();

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
