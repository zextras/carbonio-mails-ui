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
	useModal,
	useTheme
} from '@zextras/carbonio-design-system';
import { addBoard, soapFetch, t, useLocalStorage } from '@zextras/carbonio-shell-ui';
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
import { generateSmartLinkHtml } from './utils/edit-view-utils';
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
	useEditorsStore,
	getEditor,
	useEditorText
} from '../../../../store/zustand/editor';
import {
	BoardContext,
	CloseBoardReasons,
	MailsEditorV2,
	SmartLinkAttachment
} from '../../../../types';
import {
	CreateSmartLinksRequest,
	CreateSmartLinksResponse
} from '../../../../types/soap/create-smart-links';

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

function filterMatchingObjects(
	smartLinks: SmartLinkAttachment[],
	savedAttachments: MailsEditorV2['savedAttachments']
): MailsEditorV2['savedAttachments'] {
	return savedAttachments.reduce((accumulator, attachment) => {
		const isMatching = smartLinks.some(
			(smartLink) =>
				smartLink.draftId === attachment.messageId && smartLink.partName === attachment.partName
		);
		if (isMatching) {
			accumulator.push(attachment);
		}
		return accumulator;
	}, [] as MailsEditorV2['savedAttachments']);
}

export const EditView: FC<EditViewProp> = ({ editorId, closeController, onMessageSent }) => {
	const { setAutoSendTime } = useEditorAutoSendTime(editorId);

	const { status: saveDraftAllowedStatus, saveDraft } = useEditorDraftSave(editorId);
	const { status: sendAllowedStatus, send: sendMessage } = useEditorSend(editorId);
	const draftSaveProcessStatus = useEditorDraftSaveProcessStatus(editorId);
	const createSnackbar = useSnackbar();
	const [dropZoneEnabled, setDropZoneEnabled] = useState<boolean>(false);
	const { addStandardAttachments, addInlineAttachments, hasStandardAttachments } =
		useEditorAttachments(editorId);
	const theme = useTheme();

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
	const [_, setSmartLinks] = useLocalStorage<SmartLinkAttachment[]>('smartLinks', []);
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
	const { removeSavedAttachment } = useEditorAttachments(editorId);

	const { text, setText } = useEditorText(editorId);
	const smartLinksString = localStorage.getItem('smartlinks') ?? '[]';
	const draftId = getEditor({ id: editorId })?.did;

	const smartLinks: Array<SmartLinkAttachment> = JSON.parse(smartLinksString);
	const draftSmartLinks = useMemo(
		() => smartLinks.filter((smartLink) => smartLink.draftId === draftId),
		[draftId, smartLinks]
	);
	const [isConvertingToSmartLink, setIsConvertingToSmartLink] = useState(false);

	const { savedStandardAttachments } = useEditorAttachments(editorId);

	const convertedAttachments = filterMatchingObjects(smartLinks, savedStandardAttachments);

	const createSmartLinksAction = useCallback((): Promise<void> => {
		setIsConvertingToSmartLink(true);
		return soapFetch<CreateSmartLinksRequest, CreateSmartLinksResponse>('CreateSmartLinks', {
			_jsns: 'urn:zimbraMail',
			attachments: draftSmartLinks
		}).then((response) => {
			setIsConvertingToSmartLink(false);
			if ('Fault' in response) {
				createSnackbar({
					key: `save-draft`,
					replace: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000
				});
			} else {
				setSmartLinks((state) => state.filter((smartLink) => smartLink.draftId !== draftId));
				const textWithLink = {
					plainText: map(response.smartLinks, (smartLink) => smartLink.publicUrl)
						.join('\n')
						.concat(text.plainText),
					richText: text.richText.concat(
						` ${map(response.smartLinks, (smartLink, index) =>
							generateSmartLinkHtml({ smartLink, convertedAttachments, index, theme })
						).join('<br/>')}`
					)
				};
				setText(textWithLink);
				draftSmartLinks.forEach((smartLink) => {
					removeSavedAttachment(smartLink.partName);
				});
				createSnackbar({
					key: 'smartLinksCreated',
					replace: true,
					type: 'success',
					label: t('label.smart_links_created', 'smart links created'),
					autoHideTimeout: 3000
				});
			}
		});
	}, [
		draftSmartLinks,
		createSnackbar,
		setSmartLinks,
		text.plainText,
		text.richText,
		setText,
		draftId,
		convertedAttachments,
		theme,
		removeSavedAttachment
	]);

	const onSendClick = useCallback((): void => {
		const onConfirmCallback = async (): Promise<void> => {
			if (draftSmartLinks.length > 0) {
				await createSmartLinksAction();
			}
			close({ reason: CLOSE_BOARD_REASON.SEND });
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
		createSmartLinksAction,
		editorId,
		hasStandardAttachments,
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
					await createSmartLinksAction();
				}
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
		[
			close,
			createModal,
			createSmartLinksAction,
			editorId,
			hasStandardAttachments,
			saveDraft,
			setAutoSendTime,
			draftSmartLinks.length
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
