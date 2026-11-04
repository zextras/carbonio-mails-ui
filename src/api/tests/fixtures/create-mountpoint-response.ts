/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { CreateMountpointResponse } from 'api/mount-shared-folder-soap-api';

// CreateMountpoint of a shared folder with a custom color: link is an array, rid a number, and the
// folder has rgb and no color (a real response from the test server)
export const createMountpointResponse = {
	link: [
		{
			id: '257',
			uuid: 'cdc66d9a-48c7-4886-a7d6-4aee60677677',
			deletable: true,
			name: 'Mounted F',
			absFolderPath: '/Mounted F',
			l: '1',
			luuid: 'f4cb98e8-c45f-465a-bd7d-88c84c179fa2',
			f: '#',
			rgb: '#FF0000',
			view: 'message',
			rev: 2,
			ms: 2,
			webOfflineSyncDays: 0,
			activesyncdisabled: false,
			zid: '79e4f645-b714-483b-a140-9cb2360f0285',
			rid: 257,
			ruuid: '599c69eb-ffaf-4324-8f4e-7eafb89675cd',
			owner: 'user1@example.com',
			reminder: false,
			n: 0,
			s: 0,
			oname: 'Shared F',
			rest: 'https://example.com/home/user1@example.com/Shared%20F',
			perm: 'r'
		}
	],
	_jsns: 'urn:zimbraMail'
} satisfies CreateMountpointResponse;
