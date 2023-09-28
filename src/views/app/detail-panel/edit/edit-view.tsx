/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	ChangeEvent,
	FC,
	memo,
	SyntheticEvent,
	useCallback,
	useMemo,
	useState
} from 'react';

import {
	Button,
	Container,
	Dropdown,
	IconButton,
	Tooltip,
	ButtonProps,
	useSnackbar,
	Icon,
	Input,
	Padding,
	useModal
} from '@zextras/carbonio-design-system';
import { addBoard, t } from '@zextras/carbonio-shell-ui';
import { filter, map, noop } from 'lodash';
import type { TinyMCE } from 'tinymce/tinymce';

import { checkSubjectAndAttachment } from './check-subject-attachment';
import DropZoneAttachment from './dropzone-attachment';
import { EditAttachmentsBlock } from './edit-attachments-block';
import { AddAttachmentsDropdown } from './parts/add-attachments-dropdown';
import { EditViewDraftSaveInfo } from './parts/edit-view-draft-save-info';
import { EditViewIdentitySelector } from './parts/edit-view-identity-selector';
import { EditViewSendButtons } from './parts/edit-view-send-buttons';
import { RecipientsRows } from './parts/recipients-rows';
import { TextEditorContainer, TextEditorContent } from './parts/text-editor-container';
import WarningBanner from './parts/warning-banner';
import { GapContainer, GapRow } from '../../../../commons/gap-container';
import { CLOSE_BOARD_REASON, EditViewActions, MAILS_ROUTE, TIMEOUTS } from '../../../../constants';
import { buildArrayFromFileList } from '../../../../helpers/files';
import {
	getAvailableAddresses,
	getIdentitiesDescriptors,
	getIdentityDescriptor,
	IdentityDescriptor
} from '../../../../helpers/identities';
import { getMailBodyWithSignature } from '../../../../helpers/signatures';
import {
	useEditorAutoSendTime,
	useEditorDraftSave,
	useEditorDraftSaveProcessStatus,
	useEditorIdentityId,
	useEditorIsRichText,
	useEditorIsUrgent,
	useEditorRecipients,
	useEditorRequestReadReceipt,
	useEditorSend,
	useEditorSubject,
	useEditorText,
	useEditorAttachments,
	deleteEditor
} from '../../../../store/zustand/editor';
import { BoardContext, CloseBoardReasons, EditorRecipients } from '../../../../types';

export type EditViewProp = {
	editorId: string;
	closeController?: ({ reason }: { reason?: CloseBoardReasons }) => void;
	hideController?: () => void;
	showController?: () => void;
};

type FileSelectProps = {
	editor: TinyMCE;
	files: FileList;
};

const MemoizedTextEditorContainer = memo(TextEditorContainer);

export const EditView: FC<EditViewProp> = ({
	editorId,
	closeController,
	hideController,
	showController
}) => {
	const { subject, setSubject } = useEditorSubject(editorId);
	const { isRichText, setIsRichText } = useEditorIsRichText(editorId);
	const { text, setText } = useEditorText(editorId);
	const { identityId, setIdentityId } = useEditorIdentityId(editorId);
	const { recipients, setRecipients } = useEditorRecipients(editorId);
	const { setAutoSendTime } = useEditorAutoSendTime(editorId);

	const { isUrgent, setIsUrgent } = useEditorIsUrgent(editorId);
	const { requestReadReceipt, setRequestReadReceipt } = useEditorRequestReadReceipt(editorId);
	const { status: saveDraftAllowedStatus, saveDraft } = useEditorDraftSave(editorId);
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

	const onSendError = useCallback(
		(error: string): void => {
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
		deleteEditor({ id: editorId });
	}, [createSnackbar, editorId]);

	const createModal = useModal();
	const onScheduledSendClick = useCallback(
		(scheduledTime: number): void => {
			const onConfirmCallback = (): void => {
				setAutoSendTime(scheduledTime);
				saveDraft();
				close({ reason: CLOSE_BOARD_REASON.SEND_LATER });
			};
			checkSubjectAndAttachment({
				text,
				hasAttachments: hasStandardAttachments,
				subject,
				onConfirmCallback,
				close,
				createModal
			});
		},
		[close, createModal, hasStandardAttachments, saveDraft, setAutoSendTime, subject, text]
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
			text,
			hasAttachments: hasStandardAttachments,
			subject,
			onConfirmCallback,
			close,
			createModal
		});
	}, [
		close,
		createModal,
		hasStandardAttachments,
		onSendComplete,
		onSendCountdownTick,
		onSendError,
		sendMessage,
		subject,
		text
	]);

	const onIdentityChanged = useCallback(
		(identity: IdentityDescriptor): void => {
			setIdentityId(identity.id);
			const textWithSignature = getMailBodyWithSignature(text, identity.defaultSignatureId);
			setText(textWithSignature);
		},
		[setIdentityId, setText, text]
	);

	const onRecipientsChanged = useCallback(
		(updatedRecipients: EditorRecipients): void => {
			setRecipients(updatedRecipients);
		},
		[setRecipients]
	);

	const onSubjectChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setSubject(event.target.value);
		},
		[setSubject]
	);

	const onBodyChange = useCallback(
		(content: TextEditorContent): void => {
			setText({ plainText: content.plainText, richText: content.richText });
		},
		[setText]
	);

	const identitiesList = useMemo<Array<IdentityDescriptor>>(() => getIdentitiesDescriptors(), []);

	const showIdentitySelector = useMemo<boolean>(() => identitiesList.length > 1, [identitiesList]);
	const selectedIdentity = useMemo<IdentityDescriptor | null>(
		() => getIdentityDescriptor(identityId),
		[identityId]
	);

	const toggleRichTextEditor = useCallback(() => {
		setIsRichText(!isRichText);
	}, [isRichText, setIsRichText]);

	const toggleImportant = useCallback(() => {
		setIsUrgent(!isUrgent);
	}, [isUrgent, setIsUrgent]);

	const toggleReceiptRequest = useCallback(() => {
		setRequestReadReceipt(!requestReadReceipt);
	}, [requestReadReceipt, setRequestReadReceipt]);

	const addFilesFromLocal = useCallback(
		(fileList: FileList) => {
			const files = buildArrayFromFileList(fileList);
			addStandardAttachments(files, {});
		},
		[addStandardAttachments]
	);

	const addFilesFromFiles = useCallback((filesResponse) => {
		// TODO handle files response and update attachment in Editor store
	}, []);

	const addPublicLinkFromFiles = useCallback(
		(filesResponse) => {
			const textWithLink = {
				plainText: map(filesResponse, (i: { value: { url: string } }) => i.value.url)
					.join('\n')
					.concat(text.plainText),
				richText: ` ${map(
					filesResponse,
					(i: { value: { url: string } }) => `<p><a href="${i.value.url}"> ${i.value.url}</a></p>`
				).join('')}`.concat(text.richText)
			};
			setText(textWithLink);
		},
		[setText, text]
	);
	const onDragOverEvent = useCallback((event: SyntheticEvent): void => {
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

	// TODO ask designers if the check must be performed only on TO or also on CC and BCC
	const isSendingToYourself = useMemo(() => {
		const availableAddresses = map(
			getAvailableAddresses(),
			(availableAddress) => availableAddress.address
		);
		const recipientsAddresses = map(recipients.to, (recipient) => recipient.address);

		return (
			filter(recipientsAddresses, (recipientAddress): boolean =>
				availableAddresses.includes(recipientAddress)
			).length > 0
		);
	}, [recipients.to]);

	const flexStart = 'flex-start';
	const composerOptions = useMemo(
		() => [
			{
				id: 'richText',
				label: isRichText
					? t('tooltip.disable_rich_text', 'Disable rich text editor')
					: t('tooltip.enable_rich_text', 'Enable rich text editor'),
				onClick: toggleRichTextEditor
			},
			{
				id: 'urgent',
				label: isUrgent
					? t('label.mark_as_un_important', 'Mark as unimportant')
					: t('label.mark_as_important', 'Mark as important'),
				onClick: toggleImportant
			},
			{
				id: 'read_receipt',
				label: requestReadReceipt
					? t('label.remove_request_receipt', 'Remove read receipt request')
					: t('label.request_receipt', 'Request read receipt'),
				onClick: toggleReceiptRequest
			}
		],
		[
			isRichText,
			toggleRichTextEditor,
			isUrgent,
			toggleImportant,
			requestReadReceipt,
			toggleReceiptRequest
		]
	);

	const isIconsVisible = useMemo(
		() => requestReadReceipt || isUrgent,
		[isUrgent, requestReadReceipt]
	);

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
					{showIdentitySelector && (
						<EditViewIdentitySelector
							selected={selectedIdentity}
							identities={identitiesList}
							onIdentitySelected={onIdentityChanged}
						/>
					)}

					<GapRow mainAlignment={'flex-end'} gap={'medium'}>
						<AddAttachmentsDropdown
							addFilesFromLocal={addFilesFromLocal}
							addFilesFromFiles={addFilesFromFiles}
							addPublicLinkFromFiles={addPublicLinkFromFiles}
							editorId={editorId}
						/>
						<Dropdown items={composerOptions} selectedBackgroundColor="gray5">
							<IconButton size="large" icon="MoreVertical" onClick={noop} />
						</Dropdown>
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
							onSendLater={onScheduledSendClick}
							onSendNow={onSendClick}
							disabled={!sendAllowedStatus?.allowed}
							tooltip={sendAllowedStatus?.reason ?? ''}
						/>
					</GapRow>
				</GapRow>

				{/* Header end */}

				{isSendingToYourself && <WarningBanner />}

				<GapContainer
					mainAlignment={flexStart}
					crossAlignment={flexStart}
					background={'white'}
					padding={{ all: 'small' }}
					gap={'small'}
				>
					<Container mainAlignment={flexStart} crossAlignment={flexStart} height={'fit'}>
						<RecipientsRows recipients={recipients} onRecipientsChange={onRecipientsChanged} />
					</Container>
					<Container mainAlignment={flexStart} crossAlignment={flexStart} height={'fit'}>
						<Container
							orientation="horizontal"
							background="gray5"
							style={{ overflow: 'hidden' }}
							padding={{ all: 'none' }}
						>
							<Container background="gray5" style={{ overflow: 'hidden' }} padding="0">
								<Input
									data-testid={'subject'}
									label={t('label.subject', 'Subject')}
									value={subject}
									onChange={onSubjectChange}
								></Input>
							</Container>
							{isIconsVisible && (
								<Container
									width="fit"
									background="gray5"
									padding={{ right: 'medium', left: 'small' }}
									orientation="horizontal"
								>
									{requestReadReceipt && (
										<Tooltip label={t('label.request_receipt', 'Request read receipt')}>
											<Padding right="small">
												<Icon icon="CheckmarkSquare" color="secondary" size="large" />
											</Padding>
										</Tooltip>
									)}
									{isUrgent && (
										<Tooltip label={t('tooltip.marked_as_important', 'Marked as important')}>
											<Icon icon="ArrowUpward" color="secondary" size="large" />
										</Tooltip>
									)}
								</Container>
							)}
						</Container>
					</Container>

					<EditAttachmentsBlock editorId={editorId} />

					<MemoizedTextEditorContainer
						onDragOver={onDragOverEvent}
						onFilesSelected={onInlineAttachmentsSelected}
						onContentChanged={onBodyChange}
						richTextMode={isRichText}
						content={text}
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
