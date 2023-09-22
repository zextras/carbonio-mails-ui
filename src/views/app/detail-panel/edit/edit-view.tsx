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

import { checkSubjectAndAttachment } from './check-subject-attachment';
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
import { BoardContext, CloseBoardReasons, EditorRecipients } from '../../../../types';
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { useEditorDraftSaveNoTimeout } from '../../../../store/zustand/editor/hooks/save-draft';

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
	const { status: saveDraftAllowedStatusNoTimeout, saveDraftNoTimeout } = useEditorDraftSaveNoTimeout(editorId);
	const { status: sendAllowedStatus, send: sendMessage } = useEditorSend(editorId);
	const draftSaveProcessStatus = useEditorDraftSaveProcessStatus(editorId);
	const createSnackbar = useSnackbar();
	const [dropZoneEnabled, setDropZoneEnabled] = useState<boolean>(false);
	const { addStandardAttachments, addInlineAttachments, hasStandardAttachments } =
		useEditorAttachments(editorId);

	// Performs cleanups and invoke the external callback
	const close = useCallback(
		({ reason }: { reason?: CloseBoardReasons }) => {
			closeController && closeController({ reason });
		},
		[closeController]
	);

	const onSaveClick = useCallback<ButtonProps['onClick']>((): void => {
		saveDraftNoTimeout();
	}, [saveDraftNoTimeout]);

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

	const getSizeDescription = (size: number): string => {
		let value = '';
		if (size < 1024000) {
			value = `${Math.round(size / 1024)} KB`;
		} else if (size < 1024000000) {
			value = `${Math.round(size / 1024 / 1024) } MB`;
		} else {
			value = `${Math.round(size / 1024 / 1024 / 1024)} GB`;
		}
		return value;
	};

	const onSendError = useCallback(
		(error: string): void => {

			const errMessageSize = new RegExp('^Message of size');
			const errInvalidAddress = new RegExp('^Invalid address');
			if ( errMessageSize.test(error) ) {

				const sizeMatched = error.match(/(\d+)/);
				let messageSize = 0;
				if (sizeMatched) {
					messageSize = Number(sizeMatched[0]);
				}

				const maxMessageSize = getUserSettings().attrs.zimbraMtaMaxMessageSize;
				const realMaxMessageSize = getSizeDescription(Number(maxMessageSize) - (Number(maxMessageSize)*30/100));
				const realMessageSize = getSizeDescription(messageSize - (messageSize*30/100));

				const errMessage = 'l\'attuale dimensione del messaggio ('+ realMessageSize +')  supera il limite massimo consentito (' + realMaxMessageSize + ').';
				const errMessage2 = 'Rimuovi uno o più allegati o immagini inline e riprova!';

				createSnackbar({
					key: `mail-${editorId}`,
					replace: true,
					type: 'error',
					label: 'Non è stato possibile inviare il messaggio: ' + errMessage,
					autoHideTimeout: 5000
				});

				if (errMessage2.length > 0 ) {
					createSnackbar({
						key: `mail-${editorId}-2`,
						replace: false,
						type: 'info',
						label: 'Suggerimento: '+ errMessage2,
						autoHideTimeout: 5000
					});
				}

			} else if (errInvalidAddress.test(error)) {
				const emailMatch = error.match(/(\S+@\S+)/);
				let realEmail = '';
				let cleanEmail = '';
				if (emailMatch) {
					realEmail = emailMatch[0];
					cleanEmail = realEmail.slice(0, -1)
				}

				const errMessage = 'Il destinatario con email ' + cleanEmail + ' non esiste o è stata disabilitata la casella di posta.';
				const errMessage2 = 'Rimuovi il contatto ' + cleanEmail + ' e riprova!';


				createSnackbar({
					key: `mail-${editorId}`,
					replace: true,
					type: 'error',
					label: 'Non è stato possibile inviare il messaggio: ' + errMessage,
					autoHideTimeout: 5000
				});

				if (errMessage2.length > 0 ) {
					createSnackbar({
						key: `mail-${editorId}-2`,
						replace: false,
						type: 'info',
						label: 'Suggerimento: '+ errMessage2,
						autoHideTimeout: 5000
					});
				}

			} else {
				createSnackbar({
					key: `mail-${editorId}`,
					replace: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
					hideButton: true
				});
			}
			// TODO move outside the component (editor-utils or a new help module?)
			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit?action=${EditViewActions.RESUME}&id=${editorId}`,
				title: ''
			});
		},
		[createSnackbar, editorId]
	);

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
	const onScheduledSendClick = useCallback(
		(scheduledTime: number): void => {
			const onConfirmCallback = (): void => {
				setAutoSendTime(scheduledTime);
				saveDraft();
				close({ reason: CLOSE_BOARD_REASON.SEND_LATER });
			};
			checkSubjectAndAttachment({
				editorId,
				hasAttachments: hasStandardAttachments,
				onConfirmCallback,
				close,
				createModal
			});
		},
		[close, createModal, editorId, hasStandardAttachments, saveDraft, setAutoSendTime]
	);

	const onSendClick = useCallback((): void => {
		const onConfirmCallback = (): void => {
			sendMessage({
				onCountdownTick: onSendCountdownTick,
				onComplete: onSendComplete,
				onError: onSendError
			});
		};
		checkSubjectAndAttachment({
			editorId,
			hasAttachments: hasStandardAttachments,
			onConfirmCallback,
			close,
			createModal
		});
	}, [
		close,
		createModal,
		editorId,
		hasStandardAttachments,
		onSendComplete,
		onSendCountdownTick,
		onSendError,
		sendMessage
	]);

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
								disabled={!saveDraftAllowedStatusNoTimeout?.allowed}
							/>
						</Tooltip>
						<EditViewSendButtons
							onSendLater={onScheduledSendClick}
							onSendNow={onSendClick}
							disabled={!sendAllowedStatus?.allowed}
							tooltip={sendAllowedStatus?.reason ?? ''}
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
