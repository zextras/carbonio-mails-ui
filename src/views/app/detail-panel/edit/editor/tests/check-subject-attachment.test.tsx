/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { CloseModalFn, CreateModalFn } from '@zextras/carbonio-design-system';
import type { Mock } from 'vitest';

import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { MailsEditorV2 } from 'types/editor';
import {
	attachmentWords,
	checkSubjectAndAttachment
} from 'views/app/detail-panel/edit/editor/check-subject-attachment';

const A_SUBJECT = 'a subject';
const NEUTRAL_TEXT = { plainText: 'a text', richText: '<p>a text</p>' };

type ModalConfig = {
	id: string;
	children?: React.ReactNode;
	onConfirm?: () => void;
	onClose?: () => void;
	onSecondaryAction?: () => void;
};

function setupEditor(overrides: Partial<MailsEditorV2> = {}): MailsEditorV2 {
	const editor = { ...generateNewMessageEditor(), ...overrides };
	setupEditorStore({ editors: [editor] });
	return editor;
}

function runCheck(
	editorId: string,
	hasAttachments: boolean
): {
	onConfirmCallback: Mock;
	createModal: Mock;
	closeModal: Mock;
	modalConfig: ModalConfig | undefined;
} {
	const onConfirmCallback = vi.fn();
	const createModal = vi.fn();
	const closeModal = vi.fn();

	checkSubjectAndAttachment({
		editorId,
		hasAttachments,
		onConfirmCallback,
		createModal: createModal as unknown as CreateModalFn,
		closeModal: closeModal as unknown as CloseModalFn
	});

	return {
		onConfirmCallback,
		createModal,
		closeModal,
		modalConfig: createModal.mock.calls[0]?.[0]
	};
}

describe('checkSubjectAndAttachment', () => {
	it('invokes the confirm callback directly when subject is set and no attachment is expected', () => {
		const editor = setupEditor({
			subject: A_SUBJECT,
			text: NEUTRAL_TEXT
		});

		const { onConfirmCallback, createModal } = runCheck(editor.id, false);

		expect(onConfirmCallback).toHaveBeenCalled();
		expect(createModal).not.toHaveBeenCalled();
	});

	it('does nothing when the editor does not exist', () => {
		setupEditorStore({ editors: [] });

		const { onConfirmCallback, createModal } = runCheck('unknown-editor-id', false);

		expect(onConfirmCallback).not.toHaveBeenCalled();
		expect(createModal).not.toHaveBeenCalled();
	});

	it('opens the confirmation modal when the subject is missing', () => {
		const editor = setupEditor({
			subject: '',
			text: NEUTRAL_TEXT
		});

		const { onConfirmCallback, createModal, modalConfig } = runCheck(editor.id, false);

		expect(createModal).toHaveBeenCalled();
		expect(onConfirmCallback).not.toHaveBeenCalled();

		setupTest(<>{modalConfig?.children}</>);
		expect(screen.getByText('messages.modal.send_anyway.subject')).toBeInTheDocument();
		expect(screen.getByText('messages.modal.send_anyway.second')).toBeInTheDocument();
	});

	it('opens the modal when the text mentions an attachment but none is attached', () => {
		const attachmentWord = attachmentWords[0];
		const editor = setupEditor({
			subject: A_SUBJECT,
			text: {
				plainText: `see the ${attachmentWord} file`,
				richText: `<p>see the ${attachmentWord} file</p>`
			}
		});

		const { createModal, modalConfig } = runCheck(editor.id, false);

		expect(createModal).toHaveBeenCalled();

		setupTest(<>{modalConfig?.children}</>);
		expect(screen.getByText('messages.modal.send_anyway.no_attachments')).toBeInTheDocument();
	});

	it('shows the combined error when both subject and expected attachments are missing', () => {
		const attachmentWord = attachmentWords[0];
		const editor = setupEditor({
			subject: '',
			text: {
				plainText: `see the ${attachmentWord} file`,
				richText: `<p>see the ${attachmentWord} file</p>`
			}
		});

		const { modalConfig } = runCheck(editor.id, false);

		setupTest(<>{modalConfig?.children}</>);
		expect(
			screen.getByText('messages.modal.send_anyway.no_subject_no_attachments')
		).toBeInTheDocument();
	});

	it('invokes the confirm callback directly when an attachment is expected and present', () => {
		const attachmentWord = attachmentWords[0];
		const editor = setupEditor({
			subject: A_SUBJECT,
			text: {
				plainText: `see the ${attachmentWord} file`,
				richText: `<p>see the ${attachmentWord} file</p>`
			}
		});

		const { onConfirmCallback, createModal } = runCheck(editor.id, true);

		expect(onConfirmCallback).toHaveBeenCalled();
		expect(createModal).not.toHaveBeenCalled();
	});

	it('falls back to the plain text content when there is no rich text', () => {
		const attachmentWord = attachmentWords[0];
		const editor = setupEditor({
			subject: A_SUBJECT,
			text: { plainText: `see the ${attachmentWord} file`, richText: '' }
		});

		const { createModal } = runCheck(editor.id, false);

		expect(createModal).toHaveBeenCalled();
	});

	it('runs the confirm callback and closes the modal on modal confirm', () => {
		const editor = setupEditor({
			subject: '',
			text: NEUTRAL_TEXT
		});

		const { onConfirmCallback, closeModal, modalConfig } = runCheck(editor.id, false);

		modalConfig?.onConfirm?.();
		expect(onConfirmCallback).toHaveBeenCalled();
		expect(closeModal).toHaveBeenCalledWith(modalConfig?.id);
	});

	it('closes the modal without confirming on close and on secondary action', () => {
		const editor = setupEditor({
			subject: '',
			text: NEUTRAL_TEXT
		});

		const { onConfirmCallback, closeModal, modalConfig } = runCheck(editor.id, false);

		modalConfig?.onClose?.();
		modalConfig?.onSecondaryAction?.();

		expect(onConfirmCallback).not.toHaveBeenCalled();
		expect(closeModal).toHaveBeenCalledTimes(2);
	});
});
