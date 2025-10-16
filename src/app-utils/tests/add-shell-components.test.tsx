/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addBoardView, addRoute, addSettingsView, upsertApp } from '@zextras/carbonio-shell-ui';
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { mockAdvancedAccountAPI } from '__test__/utils';
import { addComponentsToShell } from 'app-utils/add-shell-components';
import { MAIL_APP_ID, MAILS_BOARD_VIEW_ID } from 'constants/index';

beforeEach(() => {
	createAPIInterceptor('get', 'zx/login/v3/account', HttpResponse.json({}));
	createAPIInterceptor(
		'get',
		'/service/extension/encryption/password/enabled',
		HttpResponse.json({ enabled: true })
	);
});

describe('addShellComponents', () => {
	const label = 'label.app_name';
	it('should call addRoute with the correct parameters', async () => {
		await addComponentsToShell(false);

		expect(addRoute).toHaveBeenCalledWith(
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

	it('should call addBoardView with the correct parameters', async () => {
		await addComponentsToShell(false);
		expect(addBoardView).toHaveBeenCalledWith(
			expect.objectContaining({
				id: MAILS_BOARD_VIEW_ID,
				component: expect.anything()
			})
		);
	});
	it('should call addSettingsView with all the subsections when backupSelfUndeleteAllowed is true', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: true });

		await addComponentsToShell(false);

		expect(addSettingsView).toHaveBeenCalledWith(
			expect.objectContaining({
				subSections: [
					{ id: 'displaying_messages', label: 'settings.label.display_messages' },
					{ id: 'receiving_messages', label: 'label.receive_message' },
					{ id: 'recover_messages', label: 'label.recover_messages' },
					{ id: 'signatures', label: 'signatures.signature_heading' },
					{ id: 'using_signatures', label: 'label.using_signatures' },
					{ id: 'compose', label: 'labels.composing_messages' },
					{ id: 'filters', label: 'filters.filters' },
					{ id: 'trusted_addresses', label: 'label.trusted_addresses' },
					{ id: 'allowed_addresses', label: 'label.allowed_addresses' },
					{ id: 'blocked_addresses', label: 'label.blocked_addresses' }
				]
			})
		);
	});

	it('should call upsertApp function', async () => {
		await addComponentsToShell(false);

		expect(upsertApp).toHaveBeenCalledWith(
			expect.objectContaining({
				name: MAIL_APP_ID,
				display: label
			})
		);
	});

	it('should not render Recover Messages menu item when backupSelfUndeleteAllowed is false', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: false });

		await addComponentsToShell(false);

		expect(addSettingsView).toHaveBeenCalledWith(
			expect.objectContaining({
				route: 'mails',
				label,
				component: expect.anything(),
				subSections: [
					{ id: 'displaying_messages', label: 'settings.label.display_messages' },
					{ id: 'receiving_messages', label: 'label.receive_message' },
					{ id: 'signatures', label: 'signatures.signature_heading' },
					{ id: 'using_signatures', label: 'label.using_signatures' },
					{ id: 'compose', label: 'labels.composing_messages' },
					{ id: 'filters', label: 'filters.filters' },
					{ id: 'trusted_addresses', label: 'label.trusted_addresses' },
					{ id: 'allowed_addresses', label: 'label.allowed_addresses' },
					{ id: 'blocked_addresses', label: 'label.blocked_addresses' }
				]
			})
		);
	});
});
