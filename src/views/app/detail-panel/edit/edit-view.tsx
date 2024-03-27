/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Tooltip,
	ButtonProps,
	useSnackbar,
	useModal
} from '@zextras/carbonio-design-system';
import { addBoard, t } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import type { TinyMCE } from 'tinymce/tinymce';

import { checkSubject } from './check-subject-attachment';
import DropZoneAttachment from './dropzone-attachment';
import { EditAttachmentsBlock } from './edit-attachments-block';
import { AddAttachmentsDropdown } from './parts/add-attachments-dropdown';
import { EditViewDraftSaveInfo } from './parts/edit-view-draft-save-info';
import { EditViewIdentitySelector } from './parts/edit-view-identity-selector';
import { EditViewSendButtons } from './parts/edit-view-send-buttons';
import { OptionsDropdown } from './parts/options-dropdown';
import { RecipientsRows } from './parts/recipients-rows';
import { SubjectRow } from './parts/subject-row';
import { TextEditorContainer } from './parts/text-editor-container';
import WarningBanner from './parts/warning-banner';
import { GapContainer, GapRow } from '../../../../commons/gap-container';
import { CLOSE_BOARD_REASON, EditViewActions, MAILS_ROUTE, TIMEOUTS } from '../../../../constants';
import { buildArrayFromFileList } from '../../../../helpers/files';
import { getAvailableAddresses, getIdentitiesDescriptors } from '../../../../helpers/identities';
import {
	useEditorAutoSendTime,
	useEditorDraftSave,
	useEditorDraftSaveProcessStatus,
	useEditorSend,
	useEditorAttachments,
	deleteEditor,
	useEditorsStore
} from '../../../../store/zustand/editor';
import { BoardContext, CloseBoardReasons } from '../../../../types';
import { updateEditorWithSmartLinks } from '../../../../ui-actions/utils';

export type EditViewProp = {
	editorId: string;
	closeController?: ({ reason }: { reason?: CloseBoardReasons }) => void;
	hideController?: () => void;
	showController?: () => void;
	onMessageSent?: () => void;
};

type FileSelectProps = {
	editor: TinyMCE;
	files: FileList;
};
const MemoizedTextEditorContainer = memo(TextEditorContainer);
const MemoizedRecipientsRows = memo(RecipientsRows);
const MemoizedSubjectRow = memo(SubjectRow);
const MemoizedOptionsDropdown = memo(OptionsDropdown);
const MemoizedAddAttachmentsDropdown = memo(AddAttachmentsDropdown);
const MemoizedEditViewIdentitySelector = memo(EditViewIdentitySelector);

const SendToYourselfWarningBanner = ({ editorId }: { editorId: string }): JSX.Element | null => {
	const toValue = useEditorsStore((state) => state.editors[editorId].recipients.to);

	// TODO ask designers if the check must be performed only on TO or also on CC and BCC
	const isSendingToYourself = useMemo(() => {
		const availableAddresses = map(
			getAvailableAddresses(),
			(availableAddress) => availableAddress.address
		);
		const recipientsAddresses = map(toValue, (recipient) => recipient.address);

		return (
			filter(recipientsAddresses, (recipientAddress): boolean =>
				availableAddresses.includes(recipientAddress)
			).length > 0
		);
	}, [toValue]);

	return isSendingToYourself ? <WarningBanner /> : null;
};

export const EditView: FC<EditViewProp> = ({ editorId, closeController, onMessageSent }) => {
	const { setAutoSendTime } = useEditorAutoSendTime(editorId);

	const { status: saveDraftAllowedStatus, saveDraft } = useEditorDraftSave(editorId);
	const { status: sendAllowedStatus, send: sendMessage } = useEditorSend(editorId);
	const draftSaveProcessStatus = useEditorDraftSaveProcessStatus(editorId);
	const createSnackbar = useSnackbar();
	const [dropZoneEnabled, setDropZoneEnabled] = useState<boolean>(false);
	const { addStandardAttachments, addInlineAttachments } = useEditorAttachments(editorId);

	// Performs cleanups and invoke the external callback
	const close = useCallback(
		({ reason }: { reason?: CloseBoardReasons }) => {
			closeController && closeController({ reason });
		},
		[closeController]
	);

	const onSaveClick = useCallback<ButtonProps['onClick']>((): void => {
		saveDraft();
	}, [saveDraft]);

	const onSendCountdownTick = useCallback(
		(countdown: number, cancel: () => void): void => {
			createSnackbar({
				key: 'send',
				replace: true,
				type: 'info',
				label: t('messages.snackbar.sending_mail_in_count', {
					count: countdown,
					defaultValue: 'Sending your message in {{count}} second',
					defaultValue_plural: 'Sending your message in {{count}} seconds'
				}),
				autoHideTimeout: (countdown ?? 0) * 1000,
				hideButton: !cancel,
				actionLabel: t('label.undo', 'Undo'),
				onActionClick: () => {
					cancel();
					// TODO move outside the component (editor-utils or a new help module?)
					addBoard<BoardContext>({
						url: `${MAILS_ROUTE}/edit?action=${EditViewActions.RESUME}&id=${editorId}`,
						title: ''
					});
				}
			});
		},
		[createSnackbar, editorId]
	);

	const onSendError = useCallback((): void => {
		createSnackbar({
			key: `mail-${editorId}`,
			replace: true,
			type: 'error',
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
			hideButton: true
		});
		// TODO move outside the component (editor-utils or a new help module?)
		addBoard<BoardContext>({
			url: `${MAILS_ROUTE}/edit?action=${EditViewActions.RESUME}&id=${editorId}`,
			title: ''
		});
	}, [createSnackbar, editorId]);

	const onSendComplete = useCallback((): void => {
		createSnackbar({
			key: `mail-${editorId}`,
			replace: true,
			type: 'success',
			label: t('messages.snackbar.mail_sent', 'Message sent'),
			autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
			hideButton: true
		});
		onMessageSent && onMessageSent();
		deleteEditor({ id: editorId });
	}, [createSnackbar, editorId, onMessageSent]);

	const createModal = useModal();

	const showIdentitySelector = useMemo<boolean>(() => getIdentitiesDescriptors().length > 1, []);

	const onDragOverEvent = useCallback((event: React.DragEvent): void => {
		const eventType = event?.dataTransfer?.types;
		if (eventType?.includes('contact')) {
			setDropZoneEnabled(false);

			return;
		}
		event.preventDefault();
		setDropZoneEnabled(true);
	}, []);

	// TODO complete with new attachment management
	const onDropEvent = useCallback(
		(event: DragEvent): void => {
			event.preventDefault();
			setDropZoneEnabled(false);
			const fileList = event?.dataTransfer?.files;
			if (!fileList) {
				return;
			}

			const files = buildArrayFromFileList(fileList);
			addStandardAttachments(files);
		},
		[addStandardAttachments]
	);

	const onDragLeaveEvent = useCallback((event: DragEvent): void => {
		event.preventDefault();
		setDropZoneEnabled(false);
	}, []);

	const flexStart = 'flex-start';
	const onInlineAttachmentsSelected = useCallback(
		({ editor: tinymce, files: fileList }: FileSelectProps): void => {
			const files = buildArrayFromFileList(fileList);
			addInlineAttachments(files, {
				onSaveComplete: (inlineAttachments) => {
					inlineAttachments.forEach((inlineAttachment) => {
						const img = `&nbsp;<img pnsrc="${inlineAttachment.cidUrl}" data-mce-src="${inlineAttachment.cidUrl}" src="${inlineAttachment.downloadServiceUrl}" /><br/>`;
						tinymce?.activeEditor?.insertContent(img);
					});
				}
			});
		},
		[addInlineAttachments]
	);

	const { savedStandardAttachments } = useEditorAttachments(editorId);

	const draftSmartLinks = useMemo(
		() =>
			savedStandardAttachments
				.filter((attachment) => attachment.requiresSmartLinkConversion)
				.map((attachment) => ({ draftId: attachment.messageId, partName: attachment.partName })),
		[savedStandardAttachments]
	);
	const [isConvertingToSmartLink, setIsConvertingToSmartLink] = useState(false);

	const createSmartLinksAction = useCallback((): Promise<void> => {
		setIsConvertingToSmartLink(true);

		return updateEditorWithSmartLinks({ editorId, t, createSnackbar }).finally(() =>
			setIsConvertingToSmartLink(false)
		);
	}, [editorId, createSnackbar]);

	const onSendClick = useCallback((): void => {
		const onConfirmCallback = async (): Promise<void> => {
			close({ reason: CLOSE_BOARD_REASON.SEND });
			if (draftSmartLinks.length > 0) {
				try {
					await createSmartLinksAction();
				} catch (err) {
					onSendError && onSendError();
					return;
				}
			}
			sendMessage({
				onCountdownTick: onSendCountdownTick,
				onComplete: onSendComplete,
				onError: onSendError
			});
		};
		checkSubject({
			editorId,
			onConfirmCallback,
			close,
			createModal
		});
	}, [
		close,
		createModal,
		createSmartLinksAction,
		editorId,
		onSendComplete,
		onSendCountdownTick,
		onSendError,
		sendMessage,
		draftSmartLinks.length
	]);
	const onSendLaterClick = useCallback(
		(scheduledTime: number): void => {
			const onConfirmCallback = async (): Promise<void> => {
				if (draftSmartLinks.length > 0) {
					try {
						await createSmartLinksAction();
					} catch (err) {
						onSendError && onSendError();
						return;
					}
				}
				setAutoSendTime(scheduledTime);
				saveDraft();
				close({ reason: CLOSE_BOARD_REASON.SEND_LATER });
			};
			checkSubject({
				editorId,
				onConfirmCallback,
				close,
				createModal
			});
		},
		[
			editorId,
			close,
			createModal,
			draftSmartLinks.length,
			setAutoSendTime,
			saveDraft,
			createSmartLinksAction,
			onSendError
		]
	);
	return (
		<Container
			data-testid={'edit-view-editor'}
			mainAlignment={flexStart}
			crossAlignment={flexStart}
			padding={{ all: 'large' }}
			background={'gray5'}
			onDragOver={onDragOverEvent}
		>
			{dropZoneEnabled && (
				<DropZoneAttachment
					onDragOverEvent={onDragOverEvent}
					onDropEvent={onDropEvent}
					onDragLeaveEvent={onDragLeaveEvent}
				/>
			)}
			<GapContainer mainAlignment={flexStart} crossAlignment={flexStart} gap={'large'}>
				{/* Header start */}

				<GapRow
					mainAlignment={showIdentitySelector ? 'space-between' : 'flex-end'}
					orientation="horizontal"
					width="fill"
					gap={'medium'}
				>
					{showIdentitySelector && <MemoizedEditViewIdentitySelector editorId={editorId} />}

					<GapRow mainAlignment={'flex-end'} gap={'medium'}>
						<MemoizedAddAttachmentsDropdown editorId={editorId} />
						<MemoizedOptionsDropdown editorId={editorId} />
						<Tooltip
							label={saveDraftAllowedStatus?.reason}
							disabled={saveDraftAllowedStatus?.allowed}
						>
							<Button
								data-testid="BtnSaveMail"
								type="outlined"
								onClick={onSaveClick}
								label={`${t('label.save', 'Save')}`}
								disabled={!saveDraftAllowedStatus?.allowed}
							/>
						</Tooltip>
						<EditViewSendButtons
							onSendLater={onSendLaterClick}
							onSendNow={onSendClick}
							disabled={!sendAllowedStatus?.allowed || isConvertingToSmartLink}
							tooltip={sendAllowedStatus?.reason ?? ''}
							isLoading={isConvertingToSmartLink}
						/>
					</GapRow>
				</GapRow>

				{/* Header end */}

				<SendToYourselfWarningBanner editorId={editorId} />
				<GapContainer
					mainAlignment={flexStart}
					crossAlignment={flexStart}
					background={'white'}
					padding={{ all: 'small' }}
					gap={'small'}
				>
					<Container mainAlignment={flexStart} crossAlignment={flexStart} height={'fit'}>
						<MemoizedRecipientsRows editorId={editorId} />
					</Container>
					<Container mainAlignment={flexStart} crossAlignment={flexStart} height={'fit'}>
						<MemoizedSubjectRow editorId={editorId} />
					</Container>

					<EditAttachmentsBlock editorId={editorId} />

					<MemoizedTextEditorContainer
						onDragOver={onDragOverEvent}
						onFilesSelected={onInlineAttachmentsSelected}
						editorId={editorId}
						minHeight={0}
						disabled={false}
					/>
					<EditViewDraftSaveInfo processStatus={draftSaveProcessStatus} />
				</GapContainer>
			</GapContainer>
		</Container>
	);
};
