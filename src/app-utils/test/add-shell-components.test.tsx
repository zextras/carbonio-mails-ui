/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addRoute, addSearchView, addSettingsView } from '@zextras/carbonio-shell-ui';

import { mockAdvancedAccountAPI } from '../../tests/utils';
import { addShellComponents } from '../add-shell-components';

describe('addShellComponents', () => {
	const label = 'label.app_name';
	it('should call addRoute with the correct parameters', async () => {
		await addShellComponents();

		expect(addRoute).toBeCalledWith(
			expect.objectContaining({
				route: 'mails',
				position: 100,
				visible: true,
				label,
				primaryBar: 'MailModOutline',
				secondaryBar: expect.anything(),
				appView: expect.anything()
			})
		);
	});
	it('should call addSearchView with the correct parameters', async () => {
		await addShellComponents();

		expect(addSearchView).toBeCalledWith(
			expect.objectContaining({
				route: 'mails',
				component: expect.anything(),
				label
			})
		);
	});
	it('should call addBoardView with the correct parameters', async () => {
		await addShellComponents();

		expect(addSearchView).toBeCalledWith(
			expect.objectContaining({
				route: 'mails',
				component: expect.anything()
			})
		);
	});
	it('should call addSettingsView with all the subsections when backupSelfUndeleteAllowed is true', async () => {
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
	it('should not render Recover Messages menu item when backupSelfUndeleteAllowed is false', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: false });

		await addShellComponents();

		expect(addSettingsView).toBeCalledWith(
			expect.objectContaining({
				route: 'mails',
				label,
				component: expect.anything(),
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
});
