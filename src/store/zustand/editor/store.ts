/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { produce } from 'immer';
import { findIndex, remove } from 'lodash';
import { create } from 'zustand';

import {
	AttachmentUploadProcessStatus,
	EditorsStateTypeV2,
	MailsEditorV2,
	SavedAttachment,
	UnsavedAttachment
} from '../../../types';
import { AppDispatch } from '../../redux';

// extra currying as suggested in https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md#basic-usage
export const useEditorsStore = create<EditorsStateTypeV2>()((set) => ({
	editors: {},
	addEditor: (id: MailsEditorV2['id'], editor: MailsEditorV2): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				state.editors[id] = editor;
			})
		);
	},
	deleteEditor: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				delete state.editors[id];
			})
		);
	},
	updateEditor: (id: MailsEditorV2['id'], opt: Partial<MailsEditorV2>): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id] = {
						...state.editors[id],
						...opt
					};
				}
			})
		);
	},
	updateAction: (id: MailsEditorV2['id'], action: MailsEditorV2['action']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].action = action;
				}
			})
		);
	},
	updateSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = subject;
				}
			})
		);
	},
	updateText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].text = text;
				}
			})
		);
	},
	updateAutoSendTime: (
		id: MailsEditorV2['id'],
		autoSendTime: MailsEditorV2['autoSendTime']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].autoSendTime = autoSendTime;
				}
			})
		);
	},
	setDid: (id: MailsEditorV2['id'], did: MailsEditorV2['did']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].did = did;
				}
			})
		);
	},
	setIsRichText: (id: MailsEditorV2['id'], value: MailsEditorV2['isRichText']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].isRichText = value;
				}
			})
		);
	},
	setOriginalId: (id: MailsEditorV2['id'], originalId: MailsEditorV2['originalId']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].originalId = originalId;
				}
			})
		);
	},
	setSignature: (id: MailsEditorV2['id'], signature: MailsEditorV2['signature']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].signature = signature;
				}
			})
		);
	},
	setOriginalMessage: (
		id: MailsEditorV2['id'],
		originalMessage: MailsEditorV2['originalMessage']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].originalMessage = originalMessage;
				}
			})
		);
	},
	updateRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients = recipients;
				}
			})
		);
	},
	updateToRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['to']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.to = recipients;
				}
			})
		);
	},
	updateCcRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['cc']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.cc = recipients;
				}
			})
		);
	},
	updateBccRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['bcc']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.cc = recipients;
				}
			})
		);
	},
	updateIdentityId: (id: MailsEditorV2['id'], from: MailsEditorV2['identityId']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].identityId = from;
				}
			})
		);
	},
	updateIsUrgent: (id: MailsEditorV2['id'], value: MailsEditorV2['isUrgent']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].isUrgent = value;
				}
			})
		);
	},
	updateRequestReadReceipt: (
		id: MailsEditorV2['id'],
		value: MailsEditorV2['requestReadReceipt']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].requestReadReceipt = value;
				}
			})
		);
	},
	updateDraftSaveAllowedStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].draftSaveAllowedStatus = status;
				}
			})
		);
	},
	updateDraftSaveProcessStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].draftSaveProcessStatus = status;
				}
			})
		);
	},
	// updateAttachmentFiles: (editorId: MailsEditorV2['id'], res: SaveDraftResponse): void => {
	// 	set(
	// 		produce((state: EditorsStateTypeV2) => {
	// 			if (res?.m?.length) {
	// 				const message = normalizeMailMessageFromSoap(res.m[0], true);
	// 				const mp = retrieveAttachmentsType(message, 'attachment');
	// 				const attachmentFiles = findAttachmentFiles(message.parts, []);
	// 				const editor = state.editors[editorId];
	// 				editor.attachments = { mp };
	// 				editor.attachmentFiles = attachmentFiles;
	// 				editor.originalId = editor.originalId ?? editor.originalMessage?.id;
	// 				editor.did = message.id;
	// 				editor.originalMessage = message;
	// 			}
	// 		})
	// 	);
	// },
	updateSendAllowedStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].sendAllowedStatus = status;
				}
			})
		);
	},
	updateSendProcessStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].sendProcessStatus = status;
				}
			})
		);
	},
	setSavedAttachments: (id: MailsEditorV2['id'], attachment: Array<SavedAttachment>): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].savedAttachments = [...attachment];
				}
			})
		);
	},
	removeSavedAttachment: (id: MailsEditorV2['id'], partName: string): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					remove(state.editors[id].savedAttachments, ['partName', partName]);
				}
			})
		);
	},
	setUnsavedAttachments: (id: MailsEditorV2['id'], attachment: Array<UnsavedAttachment>): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].unsavedAttachments = [...attachment];
				}
			})
		);
	},
	addUnsavedAttachment: (id: MailsEditorV2['id'], attachment: UnsavedAttachment): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].unsavedAttachments.push(attachment);
				}
			})
		);
	},
	setAttachmentUploadStatus: (
		id: MailsEditorV2['id'],
		uploadId: string,
		status: AttachmentUploadProcessStatus
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					const unsavedAttachmentIndex = findIndex(state.editors[id].unsavedAttachments, [
						'uploadId',
						uploadId
					]);
					if (unsavedAttachmentIndex < 0) {
						return;
					}

					state.editors[id].unsavedAttachments[unsavedAttachmentIndex].uploadStatus = status;
				}
			})
		);
	},
	setAttachmentUploadCompleted: (id: MailsEditorV2['id'], uploadId: string, aid: string): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					const unsavedAttachmentIndex = findIndex(state.editors[id].unsavedAttachments, [
						'uploadId',
						uploadId
					]);
					if (unsavedAttachmentIndex < 0) {
						return;
					}

					state.editors[id].unsavedAttachments[unsavedAttachmentIndex].aid = aid;
					state.editors[id].unsavedAttachments[unsavedAttachmentIndex].uploadStatus = {
						status: 'completed'
					};
				}
			})
		);
	},
	removeUnsavedAttachment: (id: MailsEditorV2['id'], uploadId: string): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					remove(state.editors[id].unsavedAttachments, ['uploadId', uploadId]);
				}
			})
		);
	},
	clearAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].savedAttachments = [];
					state.editors[id].unsavedAttachments = [];
				}
			})
		);
	},
	// addAttachmentFiles: (id: MailsEditorV2['id'], files: Array<EditorAttachmentFiles>): void => {
	// 	set(
	// 		produce((state: EditorsStateTypeV2) => {
	// 			if (state?.editors?.[id]) {
	// 				state.editors[id].attachmentFiles = [...state.editors[id].attachmentFiles, ...files];
	// 				console.log('@@attachmentFiles', { attachmentFiles: state.editors[id].attachmentFiles });
	// 			}
	// 		})
	// 	);
	// },
	// updateUploadProgress: (
	// 	id: MailsEditorV2['id'],
	// 	percentCompleted: number,
	// 	fileUploadingId: string
	// ): void => {
	// 	set(
	// 		produce((state: EditorsStateTypeV2) => {
	// 			if (state?.editors?.[id] && fileUploadingId) {
	// 				state.editors[id].attachmentFiles = state.editors[id].attachmentFiles.map((file) => {
	// 					if (file.id === fileUploadingId) {
	// 						return {
	// 							...file,
	// 							uploadProgress: percentCompleted
	// 						};
	// 					}
	// 					return file;
	// 				});
	// 			}
	// 		})
	// 	);
	// },
	// addAttachment: (id: MailsEditorV2['id'], attachment: MailAttachmentParts): void => {
	// 	set(
	// 		produce((state: EditorsStateTypeV2) => {
	// 			if (state?.editors?.[id]) {
	// 				state.editors[id].attachments = [...state.editors[id].attachments, { mp: [attachment] }];
	// 			}
	// 		})
	// 	);
	// },
	// // TODO: properly type action
	// updateAttachments: (id: MailsEditorV2['id'], action: any): void => {
	// 	set(
	// 		produce((state: EditorsStateTypeV2) => {
	// 			if (state?.editors?.[id]) {
	// 				state.editors[id].attachments = {
	// 					mp: retrieveAttachmentsType(
	// 						normalizeMailMessageFromSoap(action.payload.res.m[0], true),
	// 						'attachment'
	// 					)
	// 				};
	// 			}
	// 		})
	// 	);
	// },
	addInlineAttachment: (
		id: MailsEditorV2['id'],
		attachment: MailsEditorV2['inlineAttachments'][0]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = [
						...state.editors[id].inlineAttachments,
						attachment
					];
				}
			})
		);
	},
	removeInlineAttachment: (
		id: MailsEditorV2['id'],
		attachment: MailsEditorV2['inlineAttachments'][0]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = state.editors[id].inlineAttachments.filter(
						(att: { ci: string; attach: { aid: string } }) => att.ci !== attachment.ci
					);
				}
			})
		);
	},

	// clear
	clearInlineAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = [];
				}
			})
		);
	},
	clearEditors: (): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				state.editors = {};
			})
		);
	},
	clearSubject: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = '';
				}
			})
		);
	},
	clearAutoSendTime: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].autoSendTime = undefined;
				}
			})
		);
	},
	clearText: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].text = {
						plainText: '',
						richText: ''
					};
				}
			})
		);
	},
	/**
	 * Dispatch function for messages store
	 * @param id
	 * @param dispatch
	 */
	setMessagesStoreDispatch: (id: MailsEditorV2['id'], dispatch: AppDispatch): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].messagesStoreDispatch = dispatch;
				}
			})
		);
	}
}));
