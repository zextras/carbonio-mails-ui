/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { produce } from 'immer';
import { remove } from 'lodash';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { selectUnsavedAttachmentByUploadId } from './store-selectors';
import {
	filterSavedInlineAttachment,
	filterUnsavedInlineAttachment
} from 'store/editor/editor-utils';
import {
	AttachmentUploadProcessStatus,
	SavedAttachment,
	UnsavedAttachment
} from 'types/attachments';
import { EditorTextProvider, MailsEditorV2 } from 'types/editor';
import { EditorsStateTypeV2 } from 'types/state';

export const useEditorsStore = create<EditorsStateTypeV2>()(
	devtools(
		(set, get) => ({
			editors: {},
			addEditor: (id: MailsEditorV2['id'], editor: MailsEditorV2): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						state.editors[id] = editor;
					}),
					false,
					'EDITOR/ADD_EDITOR'
				);
			},
			deleteEditor: (id: MailsEditorV2['id']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						delete state.editors[id];
					}),
					false,
					'EDITOR/DELETE_EDITOR'
				);
			},
			setSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].subject = subject;
						}
					}),
					false,
					'EDITOR/SET_SUBJECT'
				);
			},
			setText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].text = text;
						}
					}),
					false,
					'EDITOR/SET_TEXT'
				);
			},
			setAutoSendTime: (
				id: MailsEditorV2['id'],
				autoSendTime: MailsEditorV2['autoSendTime']
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].autoSendTime = autoSendTime;
						}
					}),
					false,
					'EDITOR/SET_AUTO_SEND_TIME'
				);
			},
			setDid: (id: MailsEditorV2['id'], did: MailsEditorV2['did']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].did = did;
						}
					}),
					false,
					'EDITOR/SET_DID'
				);
			},
			setSize: (id: MailsEditorV2['id'], size: MailsEditorV2['size']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].size = size;
						}
					}),
					false,
					'EDITOR/SET_SIZE'
				);
			},
			setIsDirty: (id: MailsEditorV2['id'], value: MailsEditorV2['isDirty']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id] && state.editors[id].isDirty !== value) {
							state.editors[id].isDirty = value;
						}
					}),
					false,
					'EDITOR/SET_IS_DIRTY'
				);
			},
			setIsRichText: (id: MailsEditorV2['id'], value: MailsEditorV2['isRichText']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].isRichText = value;
						}
					}),
					false,
					'EDITOR/SET_IS_RICH_TEXT'
				);
			},
			setOriginalId: (id: MailsEditorV2['id'], originalId: MailsEditorV2['originalId']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].originalId = originalId;
						}
					}),
					false,
					'EDITOR/SET_ORIGINAL_ID'
				);
			},
			setRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].recipients = recipients;
						}
					}),
					false,
					'EDITOR/SET_RECIPIENTS'
				);
			},
			setToRecipients: (
				id: MailsEditorV2['id'],
				recipients: MailsEditorV2['recipients']['to']
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].recipients.to = recipients;
						}
					}),
					false,
					'EDITOR/SET_TO_RECIPIENTS'
				);
			},
			setCcRecipients: (
				id: MailsEditorV2['id'],
				recipients: MailsEditorV2['recipients']['cc']
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].recipients.cc = recipients;
						}
					}),
					false,
					'EDITOR/SET_CC_RECIPIENTS'
				);
			},
			setBccRecipients: (
				id: MailsEditorV2['id'],
				recipients: MailsEditorV2['recipients']['bcc']
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].recipients.bcc = recipients;
						}
					}),
					false,
					'EDITOR/SET_BCC_RECIPIENTS'
				);
			},
			setIdentityId: (id: MailsEditorV2['id'], from: MailsEditorV2['identityId']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].identityId = from;
						}
					}),
					false,
					'EDITOR/SET_IDENTITY_ID'
				);
			},
			setIsUrgent: (id: MailsEditorV2['id'], value: MailsEditorV2['isUrgent']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].isUrgent = value;
						}
					}),
					false,
					'EDITOR/SET_IS_URGENT'
				);
			},
			setRequestReadReceipt: (
				id: MailsEditorV2['id'],
				value: MailsEditorV2['requestReadReceipt']
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].requestReadReceipt = value;
						}
					}),
					false,
					'EDITOR/SET_REQUEST_READ_RECEIPT'
				);
			},
			setDraftSaveAllowedStatus: (id, status): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].draftSaveAllowedStatus = status;
						}
					}),
					false,
					'EDITOR/SET_DRAFT_SAVE_ALLOWED_STATUS'
				);
			},
			setDraftSaveProcessStatus: (id, status): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].draftSaveProcessStatus = status;
						}
					}),
					false,
					'EDITOR/SET_DRAFT_SAVE_PROCESS_STATUS'
				);
			},
			setSendAllowedStatus: (id, status): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].sendAllowedStatus = status;
						}
					}),
					false,
					'EDITOR/SET_SEND_ALLOWED_STATUS'
				);
			},
			setSendProcessStatus: (id, status): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].sendProcessStatus = status;
						}
					}),
					false,
					'EDITOR/SET_SEND_PROCESS_STATUS'
				);
			},
			setSavedAttachments: (id: MailsEditorV2['id'], attachment: Array<SavedAttachment>): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].savedAttachments = [...attachment];
						}
					}),
					false,
					'EDITOR/SET_SAVED_ATTACHMENTS'
				);
			},
			removeSavedAttachment: (id: MailsEditorV2['id'], partName: string): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							remove(state.editors[id].savedAttachments, ['partName', partName]);
						}
					}),
					false,
					'EDITOR/REMOVE_SAVED_ATTACHMENT'
				);
			},
			removeUnsavedAttachments: (id: MailsEditorV2['id']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].unsavedAttachments = [];
						}
					}),
					false,
					'EDITOR/REMOVE_UNSAVED_ATTACHMENTS'
				);
			},
			addUnsavedAttachment: (id: MailsEditorV2['id'], attachment: UnsavedAttachment): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].unsavedAttachments.push(attachment);
						}
					}),
					false,
					'EDITOR/ADD_UNSAVED_ATTACHMENT'
				);
			},
			addUnsavedAttachments: (
				id: MailsEditorV2['id'],
				attachments: Array<UnsavedAttachment>
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].unsavedAttachments.push(...attachments);
						}
					}),
					false,
					'EDITOR/ADD_UNSAVED_ATTACHMENTS'
				);
			},
			addSavedAttachment: (id: MailsEditorV2['id'], attachment: SavedAttachment): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].savedAttachments.push(attachment);
						}
					}),
					false,
					'EDITOR/ADD_SAVED_ATTACHMENT'
				);
			},
			setAttachmentUploadStatus: (
				id: MailsEditorV2['id'],
				uploadId: string,
				status: AttachmentUploadProcessStatus
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						const unsavedAttachment = selectUnsavedAttachmentByUploadId(state, id, uploadId);
						if (!unsavedAttachment) {
							return;
						}

						unsavedAttachment.uploadStatus = status;
					}),
					false,
					'EDITOR/SET_ATTACHMENT_UPLOAD_STATUS'
				);
			},
			setAttachmentUploadCompleted: (
				id: MailsEditorV2['id'],
				uploadId: string,
				aid: string
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						const unsavedAttachment = selectUnsavedAttachmentByUploadId(state, id, uploadId);
						if (!unsavedAttachment) {
							return;
						}

						unsavedAttachment.aid = aid;
						unsavedAttachment.uploadStatus = {
							status: 'completed'
						};
					}),
					false,
					'EDITOR/SET_ATTACHMENT_UPLOAD_COMPLETED'
				);
			},
			removeUnsavedAttachment: (id: MailsEditorV2['id'], uploadId: string): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							remove(state.editors[id].unsavedAttachments, ['uploadId', uploadId]);
						}
					}),
					false,
					'EDITOR/REMOVE_UNSAVED_ATTACHMENT'
				);
			},
			clearStandardAttachments: (id: MailsEditorV2['id']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].savedAttachments = filterSavedInlineAttachment(
								state.editors[id].savedAttachments
							);
							state.editors[id].unsavedAttachments = filterUnsavedInlineAttachment(
								state.editors[id].unsavedAttachments
							);
						}
					}),
					false,
					'EDITOR/CLEAR_STANDARD_ATTACHMENTS'
				);
			},
			/**
			 * Function for messages store
			 * @param id
			 */

			setSignatureId: (id: MailsEditorV2['id'], signId: MailsEditorV2['signatureId']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].signatureId = signId;
						}
					}),
					false,
					'EDITOR/SET_SIGNATURE_ID'
				);
			},
			setIsSmimeSign: (id: MailsEditorV2['id'], value: MailsEditorV2['isSmimeSign']): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].isSmimeSign = value;
						}
					}),
					false,
					'EDITOR/SET_IS_SMIME_SIGN'
				);
			},
			setIsSmimeEncrypt: (
				id: MailsEditorV2['id'],
				value: MailsEditorV2['isSmimeEncrypt']
			): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].isSmimeEncrypt = value;
						}
					}),
					false,
					'EDITOR/SET_IS_SMIME_ENCRYPT'
				);
			},
			setTextProvider: (id: MailsEditorV2['id'], provider: EditorTextProvider): void => {
				set(
					produce((state: EditorsStateTypeV2) => {
						if (state?.editors?.[id]) {
							state.editors[id].textProvider = provider;
						}
					}),
					false,
					'EDITOR/SET_TEXT_PROVIDER'
				);
			},

			// Iterate through editors to find one with matching draftId and return it. Return null if not found
			getEditorByDraftId: (draftId: string): MailsEditorV2 | null => {
				let foundEditor: MailsEditorV2 | null = null;
				Object.values(get().editors).forEach((editor) => {
					if (editor.did === draftId) {
						foundEditor = editor;
					}
				});
				return foundEditor;
			},

			// Return all editors matching any of the provided draft IDs
			getEditorsByDraftsId: (draftsId: Array<string>): Array<MailsEditorV2 & { did: string }> => {
				const foundEditors: Array<MailsEditorV2 & { did: string }> = [];
				Object.values(get().editors).forEach((editor) => {
					if (editor.did && draftsId.includes(editor.did)) {
						foundEditors.push(editor as MailsEditorV2 & { did: string });
					}
				});
				return foundEditors;
			}
		}),
		{ name: 'carbonio-mails-ui-EDITORS-SLICE' }
	)
);
