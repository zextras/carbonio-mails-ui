/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createAsyncThunk } from '@reduxjs/toolkit';

import { getFullMsg } from '../../api/helpers/get-msg-service';
import type { MailMessage } from '../../types';

type GetMsgCallProps = {
	msgId: string;
};

export const getFullMsgAsyncThunk = createAsyncThunk<MailMessage, GetMsgCallProps>(
	'messages/getFullMsg',
	getFullMsg
);
