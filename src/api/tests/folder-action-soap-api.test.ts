/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapFolderAction } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { folderActionSoapApi } from 'api/folder-action-soap-api';
import {
	folderActionGrantResponse,
	folderActionRenameResponse
} from 'api/tests/fixtures/folder-action-responses';
import { BatchRequest } from 'types/soap/soap';

const RETENTION_POLICY = { purge: { policy: { lifetime: '7d', type: 'user' } } };

describe('folderActionSoapApi', () => {
	it('sends a single FolderAction without rgb or retention policy', async () => {
		const folder = generateFolder();
		const interceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');

		folderActionSoapApi({ folder, op: 'update', name: 'renamed', color: 2 });

		const { action } = await interceptor;
		expect(action).toEqual({ id: folder.id, op: 'update', name: 'renamed', color: 2 });
	});

	it('sends the rgb in a separate color action, since the server ignores it on update', async () => {
		const folder = generateFolder();
		const interceptor = createSoapAPIInterceptor<BatchRequest>('Batch');

		folderActionSoapApi({ folder, op: 'update', name: 'renamed', rgb: '#123456' });

		const { FolderActionRequest } = await interceptor;
		expect(FolderActionRequest?.map(({ action }) => action)).toEqual([
			{ id: folder.id, op: 'update', name: 'renamed' },
			{ id: folder.id, op: 'color', rgb: '#123456' }
		]);
	});

	it('batches the color and retention policy actions after the main one', async () => {
		const folder = generateFolder();
		const interceptor = createSoapAPIInterceptor<BatchRequest>('Batch');

		folderActionSoapApi({
			folder,
			op: 'update',
			name: 'renamed',
			rgb: '#123456',
			retentionPolicy: RETENTION_POLICY
		});

		const { FolderActionRequest } = await interceptor;
		expect(FolderActionRequest?.map(({ action }) => action)).toEqual([
			{ id: folder.id, op: 'update', name: 'renamed' },
			{ id: folder.id, op: 'color', rgb: '#123456' },
			{ id: folder.id, op: 'retentionpolicy', retentionPolicy: RETENTION_POLICY }
		]);
	});

	it('returns the action the server applied', async () => {
		createSoapAPIInterceptor('FolderAction', folderActionGrantResponse);

		const result = await folderActionSoapApi({ folder: generateFolder(), op: 'grant' });

		expect('action' in result && result.action).toEqual(folderActionGrantResponse.action);
	});

	it('returns one response per action when the actions are batched', async () => {
		createSoapAPIInterceptor('Batch', {
			FolderActionResponse: [
				folderActionRenameResponse,
				{
					action: { id: folderActionRenameResponse.action.id, op: 'color' },
					_jsns: 'urn:zimbraMail'
				}
			],
			_jsns: 'urn:zimbra'
		});

		const result = await folderActionSoapApi({
			folder: generateFolder(),
			op: 'rename',
			name: 'renamed',
			rgb: '#123456'
		});

		expect(
			'FolderActionResponse' in result &&
				result.FolderActionResponse?.map(({ action }) => action.op)
		).toEqual(['rename', 'color']);
	});
});
