/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addRoute, addSearchView, addSettingsView } from '@zextras/carbonio-shell-ui';
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { mockAdvancedAccountAPI } from '../../tests/utils';
import { addComponentsToShell } from '../add-shell-components';

beforeEach(() => {
	createAPIInterceptor('get', 'zx/login/v3/account', HttpResponse.json({}));
});

describe('addShellComponents', () => {
	const label = 'label.app_name';
	it('should call addRoute with the correct parameters', async () => {
		await addComponentsToShell();

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
	it('should call addSearchView with the correct parameters', async () => {
		await addComponentsToShell();

		expect(addSearchView).toHaveBeenCalledWith(
			expect.objectContaining({
				route: 'mails',
				component: expect.anything(),
				label
			})
		);
	});
	it('should call addBoardView with the correct parameters', async () => {
		await addComponentsToShell();

		expect(addSearchView).toHaveBeenCalledWith(
			expect.objectContaining({
				route: 'mails',
				component: expect.anything()
			})
		);
	});
	it('should call addSettingsView with all the subsections when backupSelfUndeleteAllowed is true', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: true });

		await addComponentsToShell();

		expect(addSettingsView).toHaveBeenCalledWith(
			expect.objectContaining({
				subSections: [
					{ id: 'displaying_messages', label: 'settings.label.display_messages' },
					{ id: 'receiving_messages', label: 'label.receive_message' },
					{ id: 'recover_messages', label: 'label.recover_messages' },
					{ id: 'signatures', label: 'signatures.signature_heading' },
					{ id: 'using_signatures', label: 'label.using_signatures' },
					{ id: 'filters', label: 'filters.filters' },
					{ id: 'trusted_addresses', label: 'label.trusted_addresses' },
					{ id: 'allowed_addresses', label: 'label.allowed_addresses' },
					{ id: 'blocked_addresses', label: 'label.blocked_addresses' }
				]
			})
		);
	});
	it('should not render Recover Messages menu item when backupSelfUndeleteAllowed is false', async () => {
		mockAdvancedAccountAPI({ backupSelfUndeleteAllowed: false });

		await addComponentsToShell();

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
					{ id: 'filters', label: 'filters.filters' },
					{ id: 'trusted_addresses', label: 'label.trusted_addresses' },
					{ id: 'allowed_addresses', label: 'label.allowed_addresses' },
					{ id: 'blocked_addresses', label: 'label.blocked_addresses' }
				]
			})
		);
	});
});
