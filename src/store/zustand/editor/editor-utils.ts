/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EditorOperationAllowedStatus, MailsEditorV2 } from '../../../types';

/**
 *
 * @param editor
 */
export const checkDraftSaveAllowedStatus = (editor: MailsEditorV2): EditorOperationAllowedStatus =>
	// TODO Check the editor data to determine if the draft is allowed to be saved
	({ allowed: true });

export const checkSendAllowedStatus = (editor: MailsEditorV2): EditorOperationAllowedStatus =>
	// TODO Check the editor data to determine if the message is allowed to be sent
	({ allowed: true });
