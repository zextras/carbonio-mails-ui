/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import * as shellUi from '@zextras/carbonio-shell-ui';
import { HttpResponse } from 'msw';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import App from 'app';
import * as addComponentsToShell from 'app-utils/add-shell-components';
import * as registerShellActions from 'app-utils/register-shell-actions';
import * as registerShellIntegrations from 'app-utils/register-shell-integrations';
import * as useSearchRegisterer from 'app-utils/use-search-registerer';
import { BACKUP_SEARCH_ROUTE } from 'constants/index';
import { useBackupSearchStore } from 'store/backup-search/store';
import { DeletedMessageFromAPI } from 'types/api';

function aDeletedMessage(): DeletedMessageFromAPI {
	return {
		messageId: '1',
		folderId: 'folder 1',
		owner: 'francesco',
		creationDate: '2024-03-01T12:00:00Z',
		deletionDate: '2024-06-12T12:00:00Z',
		subject: 'subject',
		sender: 'francesco@example.com',
		to: 'giuliano@example.com',
		fragment: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid repellat officia'
	};
}

function updateBackupSearchStoreWith(messages: DeletedMessageFromAPI[]): void {
	act(() => {
		useBackupSearchStore.getState().setMessages(messages);
	});
}

describe('App', () => {
	const removeRouteSpy = vi.spyOn(shellUi, 'removeRoute');
	const addRouteSpy = vi.spyOn(shellUi, 'addRoute');

	beforeEach(() => {
		createAPIInterceptor('get', 'zx/login/v3/account', HttpResponse.json({}));
		createAPIInterceptor('get', 'services/catalog/services', HttpResponse.json({}));
		createSoapAPIInterceptor('GetFolder', {
			folder: [generateFolder({ name: 'Inbox' })]
		});
		createSoapAPIInterceptor('GetShareInfo', { result: { share: [] } });
	});

	it('should register a "mails" route accessible from the primary bar with specific position, name and icon', () => {
		const addComponentsToShellSpy = vi.spyOn(addComponentsToShell, 'addComponentsToShell');
		const registerShellActionSpy = vi.spyOn(registerShellActions, 'registerShellActions');
		const registerShellIntegrationsSpy = vi.spyOn(
			registerShellIntegrations,
			'registerShellIntegrations'
		);
		setupTest(<App />);
		expect(addComponentsToShellSpy).toHaveBeenCalled();
		expect(registerShellActionSpy).toHaveBeenCalled();
		expect(registerShellIntegrationsSpy).toHaveBeenCalled();
	});

	it('should register the search', () => {
		const useSearchRegistererSpy = vi.spyOn(useSearchRegisterer, 'useSearchRegisterer');
		setupTest(<App />);
		expect(useSearchRegistererSpy).toHaveBeenCalled();
	});

	it('should add the backup search route when the backup search messages are present', () => {
		updateBackupSearchStoreWith([aDeletedMessage()]);

		setupTest(<App />);

		expect(addRouteSpy).toHaveBeenCalledWith(
			expect.objectContaining({ route: BACKUP_SEARCH_ROUTE })
		);
	});

	it('should remove the backup search route when the backup search messages is present', () => {
		updateBackupSearchStoreWith([aDeletedMessage()]);

		setupTest(<App />);
		updateBackupSearchStoreWith([]);

		expect(removeRouteSpy).toHaveBeenCalledWith(BACKUP_SEARCH_ROUTE);
	});
});
