/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { AsyncThunkAction, Dispatch } from '@reduxjs/toolkit';
import { Text, useSnackbar } from '@zextras/carbonio-design-system';
import { t, replaceHistory, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { isNull, map, noop } from 'lodash';

import DeleteConvConfirm from './delete-conv-modal';
import { errorPage } from './error-page';
import MoveConvMessage from './move-conv-msg';
import RedirectAction from './redirect-message-action';
import { FOLDERS } from '../carbonio-ui-commons/constants/folders';
import { getRoot } from '../carbonio-ui-commons/store/zustand/folder';
import { getContentForPrint } from '../commons/print-conversation/print-conversation';
import { EditViewActions, MessageActionsDescriptors, TIMEOUTS } from '../constants';
import { getAttendees, getOptionalsAttendees, getSenderByOwner } from '../helpers/appointmemt';
import { useUiUtilities } from '../hooks/use-ui-utilities';
import { getMsgCall, getMsgsForPrint, msgAction } from '../store/actions';
import { sendMsg, sendMsgFromEditor } from '../store/actions/send-msg';
import { extractBody } from '../store/editor-slice-utils';
import { AppDispatch, StoreProvider } from '../store/redux';
import {
	removeMessages,
	updateMessagesFlaggedStatus,
	updateMessagesParent,
	updateMessagesReadStatus
} from '../store/zustand/message-store/store';
import type {
	MailMessage,
	MailsEditorV2,
	MessageAction,
	MessageActionReturnType,
	MsgActionOperation,
	MsgActionParameters,
	MsgActionResult
} from '../types';
import { ConvActionReturnType, ExtraWindowCreationParams, ExtraWindowsContextType } from '../types';
import { CalendarType, SenderType } from '../types/calendar';
import { createEditBoard } from '../views/app/detail-panel/edit/edit-view-board';
import { MessagePreviewPanel } from '../views/app/detail-panel/message-preview-panel';
import { getLocationOrigin } from '../views/app/detail-panel/preview/utils';

type MessageActionIdsType = Array<string>;
type MessageActionValueType = string | boolean;
type DeselectAllType = () => void;

type MessageActionPropType = {
	ids: MessageActionIdsType;
	id?: string | MessageActionIdsType;
	value?: MessageActionValueType;
	dispatch: AppDispatch;
	folderId?: string;
	shouldReplaceHistory?: boolean;
	deselectAll?: DeselectAllType;
	conversationId?: string;
	closeEditor?: boolean;
	isRestore?: boolean;
	message?: MailMessage;
};

export const setMsgRead = ({
	ids,
	value,
	dispatch,
	folderId,
	shouldReplaceHistory = false,
	deselectAll
}: MessageActionPropType): MessageActionReturnType => {
	const actDescriptor = value
		? MessageActionsDescriptors.MARK_AS_UNREAD
		: MessageActionsDescriptors.MARK_AS_READ;

	return {
		id: actDescriptor.id,
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value
			? t('action.mark_as_unread', 'Mark as unread')
			: t('action.mark_as_read', 'Mark as read'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			// TODO: the logic is inverted: setMsgRead with value true results in !read, why?
			const operation: MsgActionOperation = `${value ? '!' : ''}read`;
			dispatch(
				msgAction({
					operation,
					ids
				})
			).then((res) => {
				deselectAll && deselectAll();
				if (res.type.includes('fulfilled')) {
					const isRead = !operation.startsWith('!');
					updateMessagesReadStatus(ids, isRead);
					if (shouldReplaceHistory) {
						replaceHistory(`/folder/${folderId}`);
					}
				}
			});
		}
	};
};

export function setMsgFlag({
	ids,
	value,
	dispatch
}: Omit<
	MessageActionPropType,
	'folderId' | 'shouldReplaceHistory' | 'deselectAll'
>): MessageActionReturnType {
	const actDescriptor = value ? MessageActionsDescriptors.UNFLAG : MessageActionsDescriptors.FLAG;

	return {
		id: actDescriptor.id,
		icon: value ? 'Flag' : 'FlagOutline',
		label: value ? t('action.unflag', 'Remove flag') : t('action.flag', 'Add flag'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			const operation: MsgActionOperation = `${value ? '!' : ''}flag`;
			dispatch(
				msgAction({
					operation,
					ids
				})
			).then((response) => {
				if (response.type.includes('fulfilled')) {
					const isFlagged = !operation.startsWith('!');
					updateMessagesFlaggedStatus(ids, isFlagged);
				}
			});
		}
	};
}

type SetAsSpamProps = {
	notCanceled: boolean;
	value: MessageActionValueType | undefined;
	dispatch: AppDispatch;
	ids: Array<string>;
	shouldReplaceHistory?: boolean;
	folderId?: string;
};

export const useSetMsgAsSpam = (): ((arg: MessageActionPropType) => MessageActionReturnType) => {
	const { createSnackbar } = useUiUtilities();
	const setAsSpam = useCallback(
		({ notCanceled, value, dispatch, ids, shouldReplaceHistory, folderId }: SetAsSpamProps) => {
			if (!notCanceled) return;
			const operation: MsgActionOperation = `${value ? '!' : ''}spam`;
			dispatch(
				msgAction({
					operation,
					ids
				})
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					if (!operation.startsWith('!')) {
						updateMessagesParent(FOLDERS.SPAM, ids);
					} else {
						updateMessagesParent(FOLDERS.INBOX, ids);
					}
					if (shouldReplaceHistory) {
						replaceHistory(`/folder/${folderId}`);
					}
				}

				if (!res.type.includes('fulfilled')) {
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000
					});
				}
			});
		},
		[createSnackbar]
	);

	return useCallback(
		({ ids, value, dispatch, shouldReplaceHistory = true, folderId }) => {
			const actDescriptor = value
				? MessageActionsDescriptors.MARK_AS_NOT_SPAM
				: MessageActionsDescriptors.MARK_AS_SPAM;

			return {
				id: actDescriptor.id,
				icon: value ? 'AlertCircleOutline' : 'AlertCircle',
				label: value
					? t('action.mark_as_non_spam', 'Not spam')
					: t('action.mark_as_spam', 'Mark as spam'),
				onClick: (ev): void => {
					if (ev) ev.preventDefault();
					let notCanceled = true;

					const infoSnackbar = (hideButton = false): void => {
						createSnackbar({
							key: `trash-${ids}`,
							replace: true,
							type: 'info',
							label: value
								? t('messages.snackbar.marked_as_non_spam', 'You’ve marked this e-mail as Not Spam')
								: t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam'),
							autoHideTimeout: TIMEOUTS.SET_AS_SPAM,
							hideButton,
							actionLabel: t('label.undo', 'Undo'),
							onActionClick: () => {
								notCanceled = false;
							}
						});
					};
					infoSnackbar();
					setTimeout(() => {
						/** If the user has not clicked on the undo button, we can proceed with the action */
						setAsSpam({ notCanceled, value, dispatch, ids, shouldReplaceHistory, folderId });
					}, TIMEOUTS.SET_AS_SPAM);
				}
			};
		},
		[createSnackbar, setAsSpam]
	);
};

export const previewOnSeparatedWindow = (
	messageId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow'],
	messageActions: Array<MessageAction>
): void => {
	if (!createWindow) {
		return;
	}

	const createWindowParams: ExtraWindowCreationParams = {
		name: `message-${messageId}`,
		returnComponent: false,
		children: (
			<MessagePreviewPanel
				messageId={messageId}
				folderId={folderId}
				messageActions={messageActions}
			/>
		),
		title: subject,
		closeOnUnmount: false
	};
	createWindow(createWindowParams);
};

export function previewMessageOnSeparatedWindow(
	messageId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow'],
	messageActions: Array<MessageAction>
): ConvActionReturnType {
	const actDescriptor = MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW;
	return {
		id: actDescriptor.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		onClick: (): void => {
			previewOnSeparatedWindow(messageId, folderId, subject, createWindow, messageActions);
		}
	};
}

export function printMsg({ message }: { message: MailMessage }): MessageActionReturnType {
	const conversations = map([message], (msg) => ({
		conversation: msg.conversation,
		subject: msg.subject
	}));

	const actDescriptor = MessageActionsDescriptors.PRINT;

	return {
		id: actDescriptor.id,
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		onClick: (): void => {
			const printWindow = window.open('', '_blank');
			getMsgsForPrint({ ids: [message.id] })
				.then((res) => {
					const content = getContentForPrint({
						messages: res,
						conversations,
						isMsg: true
					});
					if (printWindow?.top) {
						printWindow.top.document.title = 'Carbonio';
						printWindow.document.write(content);
					}
				})
				.catch(() => {
					if (printWindow) printWindow.document.write(errorPage);
				});
		}
	};
}

export function showOriginalMsg({ id }: { id: string }): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.SHOW_SOURCE;

	return {
		id: actDescriptor.id,
		icon: 'CodeOutline',
		label: t('action.show_original', 'Show original'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			window.open(`/service/home/~/?auth=co&view=text&id=${id}`, '_blank');
		}
	};
}

const dispatchMsgMove = (
	dispatch: Dispatch<any>,
	ids: MessageActionIdsType,
	folderId: string
): AsyncThunkAction<MsgActionResult, MsgActionParameters, Record<string, unknown>> =>
	dispatch(
		msgAction({
			operation: 'move',
			ids,
			parent: folderId
		})
	);

const useRestoreMessage = (): ((
	dispatch: AppDispatch,
	ids: MessageActionIdsType,
	folderId: string,
	closeEditor: boolean | undefined,
	conversationId: string | undefined
) => void) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		(dispatch, ids, folderId, closeEditor, conversationId): void => {
			dispatchMsgMove(dispatch, ids, folderId)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						closeEditor &&
							replaceHistory(
								conversationId
									? `/folder/${folderId}/conversation/${conversationId}`
									: `/folder/${folderId}/conversation/-${ids[0]}`
							);
						createSnackbar({
							key: `move-${ids}`,
							replace: true,
							type: 'success',
							label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					} else {
						createSnackbar({
							key: `move-${ids}`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				});
		},
		[createSnackbar]
	);
};

export const useMoveMsgToTrash = (): ((arg: MessageActionPropType) => MessageActionReturnType) => {
	const { createSnackbar } = useUiUtilities();
	const restoreMessage = useRestoreMessage();
	return useCallback(
		({ ids, dispatch, deselectAll, folderId = FOLDERS.INBOX, conversationId, closeEditor }) => {
			const actDescriptor = MessageActionsDescriptors.MOVE_TO_TRASH;

			return {
				id: actDescriptor.id,
				icon: 'Trash2Outline',
				label: t('label.delete', 'Delete'),
				onClick: (ev): void => {
					if (ev) ev.preventDefault();

					dispatch(
						msgAction({
							operation: 'trash',
							ids
						})
					).then((res) => {
						if (res.type.includes('fulfilled')) {
							updateMessagesParent(FOLDERS.TRASH, ids);
							deselectAll && deselectAll();
							closeEditor && replaceHistory(`/folder/${folderId}`);
							createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'info',
								label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
								autoHideTimeout: 5000,
								hideButton: false,
								actionLabel: t('label.undo', 'Undo'),
								onActionClick: () =>
									restoreMessage(dispatch, ids, folderId, closeEditor, conversationId)
							});
						} else {
							createSnackbar({
								key: `trash-${ids}`,
								replace: true,
								type: 'error',
								label: t('label.error_try_again', 'Something went wrong, please try again'),
								autoHideTimeout: 3000,
								hideButton: true
							});
						}
					});
				}
			};
		},
		[createSnackbar, restoreMessage]
	);
};

export const useDeleteMsg = (): ((
	arg: Pick<MessageActionPropType, 'ids' | 'dispatch'>
) => MessageActionReturnType) => {
	const { createSnackbar, createModal } = useUiUtilities();

	return useCallback(
		({ ids, dispatch }) => {
			const actDescriptor = MessageActionsDescriptors.DELETE;

			return {
				id: actDescriptor.id,
				icon: 'Trash2Outline',
				label: t('label.delete', 'Delete'),
				onClick: (ev): void => {
					if (ev) {
						ev.preventDefault();
					}
					const closeModal = createModal({
						title: t('header.delete_email', 'Delete e-mail'),
						confirmLabel: t('action.ok', 'Ok'),
						onConfirm: () => {
							dispatch(
								msgAction({
									operation: 'delete',
									ids
								})
							).then((res) => {
								closeModal();
								if (res.type.includes('fulfilled')) {
									removeMessages(ids);
									createSnackbar({
										key: `trash-${ids}`,
										replace: true,
										type: 'info',
										label: t('messages.snackbar.message_deleted', 'Message deleted'),
										autoHideTimeout: 3000
									});
								} else {
									createSnackbar({
										key: `trash-${ids}`,
										replace: true,
										type: 'error',
										label: t('label.error_try_again', 'Something went wrong, please try again.'),
										autoHideTimeout: 3000
									});
								}
							});
						},
						onClose: () => {
							closeModal();
						},
						onSecondaryAction: () => {
							closeModal();
						},
						dismissLabel: t('label.cancel', 'Cancel'),
						children: (
							<StoreProvider>
								<Text overflow="break-word">
									{t(
										'messages.modal.delete.sure_delete_email',
										'Are you sure to delete the selected e-mail?'
									)}
								</Text>
								<Text overflow="break-word">
									{t(
										'messages.modal.delete.if_delete_lost_forever',
										'If you delete the e-mail, it will be lost forever.'
									)}
								</Text>
							</StoreProvider>
						)
					});
				}
			};
		},
		[createModal, createSnackbar]
	);
};

export function replyMsg({ id }: Pick<MessageActionPropType, 'id'>): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.REPLY;
	return {
		id: actDescriptor.id,
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			createEditBoard({
				action: EditViewActions.REPLY,
				actionTargetId: `${id}`
			});
		}
	};
}

export function replyAllMsg({ id }: Pick<MessageActionPropType, 'id'>): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.REPLY_ALL;
	return {
		id: actDescriptor.id,
		icon: 'ReplyAll',
		label: t('action.reply_all', 'Reply all'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			createEditBoard({
				action: EditViewActions.REPLY_ALL,
				actionTargetId: `${id}`
			});
		}
	};
}

export function forwardMsg({ id }: Pick<MessageActionPropType, 'id'>): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.FORWARD;
	return {
		id: actDescriptor.id,
		icon: 'Forward',
		label: t('action.forward', 'Forward'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			createEditBoard({
				action: EditViewActions.FORWARD,
				actionTargetId: `${id}`
			});
		}
	};
}

export function editAsNewMsg({ id }: Pick<MessageActionPropType, 'id'>): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.EDIT_AS_NEW;
	return {
		id: actDescriptor.id,
		icon: 'Edit2Outline',
		label: t('action.edit_as_new', 'Edit as new'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			createEditBoard({
				action: EditViewActions.EDIT_AS_NEW,
				actionTargetId: `${id}`
			});
		}
	};
}

export const useEditDraft = (): ((
	arg: Pick<MessageActionPropType, 'id' | 'folderId' | 'message'>
) => MessageActionReturnType) => {
	const { createModal } = useUiUtilities();
	return useCallback(
		({ id, message }): MessageActionReturnType => {
			const actDescriptor = MessageActionsDescriptors.EDIT_DRAFT;
			return {
				id: actDescriptor.id,
				icon: 'Edit2Outline',
				label: t('label.edit', 'Edit'),
				onClick: (ev): void => {
					if (ev) ev.preventDefault();
					if (message?.isScheduled) {
						const closeModal = createModal({
							title: t('label.warning', 'Warning'),
							confirmLabel: t('action.edit_anyway', 'Edit anyway'),
							onConfirm: () => {
								closeModal();
								createEditBoard({
									action: EditViewActions.EDIT_AS_DRAFT,
									actionTargetId: `${id}`
								});
							},
							onClose: () => {
								closeModal();
							},
							showCloseIcon: true,
							children: (
								<StoreProvider>
									<Text overflow="break-word">
										{t(
											'messages.edit_schedule_warning',
											'By editing this e-mail, the time and date previously set for delayed sending will be reset.'
										)}
									</Text>
								</StoreProvider>
							)
						});
					} else {
						createEditBoard({
							action: EditViewActions.EDIT_AS_DRAFT,
							actionTargetId: `${id}`
						});
					}
				}
			};
		},
		[createModal]
	);
};

export function sendDraft({
	message,
	dispatch
}: {
	message: MailMessage;
	dispatch: AppDispatch;
}): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.SEND;
	return {
		id: actDescriptor.id,
		icon: 'PaperPlaneOutline',
		label: t('label.send', 'Send'),
		onClick: (ev): void => {
			if (ev) ev.preventDefault();
			dispatch(
				sendMsg({
					msg: message
				})
			)
				.then() // TOFIX IRIS-4400
				.catch(); // TOFIX IRIS-4400
		}
	};
}

export function sendDraftFromPreview({
	generateEditorFunction,
	dispatch
}: {
	generateEditorFunction: () => Promise<MailsEditorV2>;
	dispatch: AppDispatch;
}): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.SEND;
	return {
		id: actDescriptor.id,
		icon: 'PaperPlaneOutline',
		label: t('label.send', 'Send'),
		onClick: async (ev): Promise<void> => {
			if (ev) ev.preventDefault();

			generateEditorFunction()
				.then((editor) => dispatch(sendMsgFromEditor({ editor })))
				.then() // TOFIX IRIS-4400
				.catch(noop); // TOFIX IRIS-4400
		}
	};
}

export const useRedirectMsg = (): ((arg: { id: string }) => MessageActionReturnType) => {
	const { createModal } = useUiUtilities();
	return useCallback(
		({ id }) => {
			const actDescriptor = MessageActionsDescriptors.REDIRECT;
			return {
				id: actDescriptor.id,
				icon: 'CornerUpRight',
				label: t('action.redirect', 'Redirect'),
				onClick: (ev): void => {
					if (ev) ev.preventDefault();
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							children: (
								<StoreProvider>
									<RedirectAction onClose={(): void => closeModal()} id={id} />
								</StoreProvider>
							)
						},
						true
					);
				}
			};
		},
		[createModal]
	);
};

export const useMoveMessageToFolder = (): ((
	arg: Pick<MessageActionPropType, 'id' | 'dispatch' | 'isRestore' | 'deselectAll' | 'folderId'>
) => MessageActionReturnType) => {
	const { createModal } = useUiUtilities();
	return useCallback(
		({ id, dispatch, isRestore, deselectAll, folderId }) => {
			const actDescriptor = isRestore
				? MessageActionsDescriptors.RESTORE
				: MessageActionsDescriptors.MOVE;
			return {
				id: actDescriptor.id,
				icon: isRestore ? 'RestoreOutline' : 'MoveOutline',
				label: isRestore ? t('label.restore', 'Restore') : t('label.move', 'Move'),
				onClick: (): void => {
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							size: 'medium',
							children: (
								<StoreProvider>
									<MoveConvMessage
										folderId={folderId ?? ''}
										selectedIDs={[id as string]}
										onClose={(): void => closeModal()}
										isMessageView
										isRestore={isRestore ?? false}
										deselectAll={deselectAll ?? noop}
										dispatch={dispatch}
									/>
								</StoreProvider>
							)
						},
						true
					);
				}
			};
		},
		[createModal]
	);
};

export const useDeleteMessagePermanently = (): ((
	arg: MessageActionPropType
) => MessageActionReturnType) => {
	const { createModal } = useUiUtilities();
	return useCallback(
		({ ids, deselectAll }) => {
			const actDescriptor = MessageActionsDescriptors.DELETE_PERMANENTLY;
			return {
				id: actDescriptor.id,
				icon: 'DeletePermanentlyOutline',
				label: t('label.delete_permanently', 'Delete Permanently'),
				onClick: (): void => {
					const closeModal = createModal(
						{
							children: (
								<StoreProvider>
									<DeleteConvConfirm
										selectedIDs={ids}
										isMessageView
										onClose={(): void => closeModal()}
										deselectAll={deselectAll || ((): null => null)}
									/>
								</StoreProvider>
							)
						},
						true
					);
				}
			};
		},
		[createModal]
	);
};

export function downloadEml({ id }: { id: string }): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.DOWNLOAD_EML;

	return {
		id: actDescriptor.id,
		icon: 'DownloadOutline',
		label: t('action.download_eml', 'Download EML'),
		onClick: (ev): void => {
			ev?.preventDefault();
			const link = document.createElement('a');
			link.download = `${id}.eml`;
			link.href = `${getLocationOrigin()}/service/home/~/?auth=co&id=${id}`;
			link.click();
			link.remove();
		}
	};
}

export const useCreateAppointment = (): (({
	item,
	openAppointmentComposer
}: {
	item: MailMessage;
	openAppointmentComposer: ReturnType<typeof useIntegratedFunction>[0];
}) => MessageActionReturnType) => {
	const createSnackbar = useSnackbar();

	return useCallback(
		({
			item,
			openAppointmentComposer
		}: {
			item: MailMessage;
			openAppointmentComposer: ReturnType<typeof useIntegratedFunction>[0];
		}): MessageActionReturnType => {
			const actDescriptor = MessageActionsDescriptors.CREATE_APPOINTMENT;
			return {
				id: actDescriptor.id,
				icon: 'CalendarModOutline',
				label: t('action.create_appointment', 'Create Appointment'),
				onClick: (ev): void => {
					ev?.preventDefault();
					const attendees = getAttendees(item);
					const optionalAttendees = getOptionalsAttendees(item);
					const rooFolder = getRoot(item.parent);
					let calendar: CalendarType | null = null;
					let sender: SenderType | null = null;
					const htmlBody = extractBody(item)[1];
					if (rooFolder && rooFolder?.isLink) {
						const calendarId = `${rooFolder.id.split(':')[0]}:${FOLDERS.CALENDAR}`;
						calendar = {
							id: calendarId,
							owner: rooFolder?.isLink && rooFolder.owner
						};
						sender = getSenderByOwner(rooFolder?.owner);
					}
					if (!item?.isComplete) {
						getMsgCall({ msgId: item.id })
							.then((message: MailMessage) => {
								const mailHtmlBody = extractBody(message)[1];
								openAppointmentComposer({
									title: message.subject,
									isRichText: true,
									richText: mailHtmlBody,
									...(!isNull(calendar) ? { calendar } : {}),
									...(!isNull(sender) ? { sender } : {}),
									attendees,
									optionalAttendees
								});
							})
							.catch(() => {
								createSnackbar({
									key: `get-msg-on-new-appointment`,
									replace: true,
									type: 'warning',
									hideButton: true,
									label: t(
										'message.snackbar.att_err',
										'There seems to be a problem when saving, please try again'
									),
									autoHideTimeout: 3000
								});
							});
					} else {
						openAppointmentComposer({
							title: item.subject,
							isRichText: true,
							richText: htmlBody,
							...(!isNull(calendar) ? { calendar } : {}),
							...(!isNull(sender) ? { sender } : {}),
							attendees,
							optionalAttendees
						});
					}
				}
			};
		},
		[createSnackbar]
	);
};
