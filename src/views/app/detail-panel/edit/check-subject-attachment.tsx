/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { CreateModalFn, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { CLOSE_BOARD_REASON } from '../../../../constants';
import { StoreProvider } from '../../../../store/redux';
import { getEditor } from '../../../../store/zustand/editor';
import type { CloseBoardReasons, MailsEditorV2 } from '../../../../types';

function getSubjectError({ subject }: { subject: MailsEditorV2['subject'] }): string {
	if (!subject) {
		return t('messages.modal.send_anyway.subject', 'Subject is missing');
	}
	return '';
}

export function checkSubject({
	editorId,
	onConfirmCallback,
	close,
	createModal
}: {
	editorId: MailsEditorV2['id'];
	onConfirmCallback: () => void;
	close: ({ reason }: { reason?: CloseBoardReasons }) => void;
	createModal: CreateModalFn;
}): void {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		return;
	}
	const { subject } = editor;
	if (!subject) {
		const closeModal = createModal({
			title: t('header.attention', 'Attention'),
			confirmLabel: t('action.ok', 'Ok'),
			dismissLabel: t('label.cancel', 'Cancel'),
			showCloseIcon: true,
			onConfirm: () => {
				onConfirmCallback();
				close({ reason: CLOSE_BOARD_REASON.SEND });
				closeModal();
			},
			onClose: () => {
				closeModal();
			},
			onSecondaryAction: () => {
				closeModal();
			},
			children: (
				<StoreProvider>
					<Text overflow="break-word" style={{ paddingTop: '1rem' }}>
						{getSubjectError({ subject })}
					</Text>
					<Text overflow="break-word" style={{ paddingBottom: '1rem' }}>
						{t('messages.modal.send_anyway.second', 'Do you still want to send the email?')}
					</Text>
				</StoreProvider>
			)
		});
	} else {
		onConfirmCallback();
		close({ reason: CLOSE_BOARD_REASON.SEND });
	}
}
