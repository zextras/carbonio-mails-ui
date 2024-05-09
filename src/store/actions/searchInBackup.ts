/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createAsyncThunk } from '@reduxjs/toolkit';

import { searchBackupDeletedMessagesAPI } from '../../api/search-backup-deleted-messages';
import { type SearchBackupDeletedMessagesAPIProps } from '../../types';

type SearchInBackupResponse = {
	messages: [];
};

export const searchDeletedMessages = createAsyncThunk<
	SearchInBackupResponse,
	SearchBackupDeletedMessagesAPIProps
>(
	'searchInBackup',
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	async (props) => {
		searchBackupDeletedMessagesAPI(props).then((res) => res);
	}
);
