/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { LineType } from '../../../../commons/utils';
import { StoreProvider } from '../../../../store/redux';
import { getEditor } from '../../../../store/zustand/editor';
import type { MailsEditorV2 } from '../../../../types';

export const attachmentWords: Array<string> = [
	t('messages.modal.send_anyway.attach', 'attach'),
	t('messages.modal.send_anyway.attachment', 'attachment'),
	t('messages.modal.send_anyway.attachments', 'attachments'),
	t('messages.modal.send_anyway.attached', 'attached'),
	t('messages.modal.send_anyway.attaching', 'attaching'),
	t('messages.modal.send_anyway.enclose', 'enclose'),
	t('messages.modal.send_anyway.enclosed', 'enclosed'),
	t('messages.modal.send_anyway.enclosing', 'enclosing')
];

function getSubjectOrAttachmentError({
	attachmentIsExpected,
	hasAttachments,
	subject
}: {
	attachmentIsExpected: boolean;
	hasAttachments: boolean;
	subject: MailsEditorV2['subject'];
}): string {
	const attachmentIsMissing = attachmentIsExpected && !hasAttachments;
	if (attachmentIsMissing && !subject) {
		return t(
			'messages.modal.send_anyway.no_subject_no_attachments',
			'Email subject is empty and you didn’t attach any files.'
		);
	}
	if (!subject) {
		return t('messages.modal.send_anyway.subject', 'Subject is missing');
	}
	if (attachmentIsMissing) {
		return t('messages.modal.send_anyway.no_attachments', 'You didn’t attach any files.');
	}
	return '';
}

export function checkSubjectAndAttachment({
	editorId,
	hasAttachments,
	onConfirmCallback,
	createModal
}: {
	editorId: MailsEditorV2['id'];
	hasAttachments: boolean;
	onConfirmCallback: () => void;
	createModal: any;
}): void {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		return;
	}
	const { text } = editor;
	const { subject } = editor;
	const attachmentIsExpected = attachmentWords.some((el) => {
		const [msgContent] = text.richText
			? text.richText.split(LineType.HTML_SEP_ID)
			: text.plainText.split(LineType.PLAINTEXT_SEP);
		return msgContent.toLowerCase().includes(el);
	});
	if ((attachmentIsExpected && !hasAttachments) || !subject) {
		const closeModal = createModal({
			title: t('header.attention', 'Attention'),
			confirmLabel: t('action.ok', 'Ok'),
			dismissLabel: t('label.cancel', 'Cancel'),
			showCloseIcon: true,
			onConfirm: () => {
				onConfirmCallback();
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
						{getSubjectOrAttachmentError({ attachmentIsExpected, hasAttachments, subject })}
					</Text>
					<Text overflow="break-word" style={{ paddingBottom: '1rem' }}>
						{t('messages.modal.send_anyway.second', 'Do you still want to send the email?')}
					</Text>
				</StoreProvider>
			)
		});
	} else {
		onConfirmCallback();
	}
}
