/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	ChangeEvent,
	FC,
	SyntheticEvent,
	useCallback,
	useMemo,
	useRef,
	useState
} from 'react';

import {
	Button,
	Container,
	ContainerProps,
	Dropdown,
	getPadding,
	Icon,
	IconButton,
	Tooltip,
	ButtonProps,
	useSnackbar,
	Text,
	Padding,
	Input
} from '@zextras/carbonio-design-system';
import { addBoard, t, useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, map, noop } from 'lodash';
import styled, { DefaultTheme, SimpleInterpolation } from 'styled-components';

import DropZoneAttachment from './dropzone-attachment';
import { EditAttachmentsBlock } from './edit-attachments-block';
import { AddAttachmentsDropdown } from './parts/add-attachments-dropdown';
import { EditViewDraftSaveInfo } from './parts/edit-view-draft-save-info';
import { EditViewIdentitySelector } from './parts/edit-view-identity-selector';
import { EditViewSendButtons } from './parts/edit-view-send-buttons';
import * as StyledComp from './parts/edit-view-styled-components';
import { RecipientsRows } from './parts/recipients-rows';
import { TextEditorContainer, TextEditorContent } from './parts/text-editor-container-v2';
import WarningBanner from './parts/warning-banner';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { GapContainer, GapRow } from '../../../../commons/gap-container';
import { EditViewActions, MAILS_ROUTE, TIMEOUTS } from '../../../../constants';
import {
	getAvailableAddresses,
	getDefaultIdentity,
	getIdentities,
	getIdentityFromParticipant,
	IdentityDescriptor
} from '../../../../helpers/identities';
import { getMailBodyWithSignature } from '../../../../helpers/signatures';
import {
	useEditorAutoSendTime,
	useEditorDraftSave,
	useEditorDraftSaveProcessStatus,
	useEditorFrom,
	useEditorIsRichText,
	useEditorIsUrgent,
	useEditorRecipients,
	useEditorRequestReadReceipt,
	useEditorSend,
	useEditorSender,
	useEditorSubject,
	useEditorText,
	useEditorAction
} from '../../../../store/zustand/editor';
import { BoardContext, EditorRecipients, Participant } from '../../../../types';

const StyledGapContainer = styled(Container)<
	ContainerProps & { gap?: keyof DefaultTheme['sizes']['padding'] }
>`
	gap: ${({ theme, gap }): SimpleInterpolation => gap && getPadding(gap, theme)};
`;

export type EditViewProp = {
	editorId: string;
	closeController?: () => void;
	hideController?: () => void;
	showController?: () => void;
};

export const createParticipantFromIdentity = (
	identity: IdentityDescriptor,
	type: typeof ParticipantRole.FROM | typeof ParticipantRole.SENDER
): Participant =>
	({
		type,
		address: identity.fromAddress,
		name: identity.identityDisplayName,
		fullName: identity.fromDisplay
	} as Participant);

export const EditView: FC<EditViewProp> = ({
	editorId,
	closeController,
	hideController,
	showController
}) => {
	const account = useUserAccount();
	const settings = useUserSettings();

	const { action, setAction } = useEditorAction(editorId);
	const inputRef = useRef<HTMLInputElement>(null);
	const { subject, setSubject } = useEditorSubject(editorId);
	const { isRichText, setIsRichText } = useEditorIsRichText(editorId);
	const { text, setText } = useEditorText(editorId);
	const { from, setFrom } = useEditorFrom(editorId);
	const { sender, setSender } = useEditorSender(editorId);
	const { recipients, setRecipients } = useEditorRecipients(editorId);
	const { autoSendTime, setAutoSendTime } = useEditorAutoSendTime(editorId);

	const { isUrgent, setIsUrgent } = useEditorIsUrgent(editorId);
	const { requestReadReceipt, setRequestReadReceipt } = useEditorRequestReadReceipt(editorId);
	const { status: saveDraftAllowedStatus, saveDraft } = useEditorDraftSave(editorId);
	const { status: sendAllowedStatus, send: sendMessage } = useEditorSend(editorId);
	const draftSaveProcessStatus = useEditorDraftSaveProcessStatus(editorId);
	const createSnackbar = useSnackbar();
	const [dropZoneEnabled, setDropZoneEnabled] = useState<boolean>(false);

	// Performs cleanups and invoke the external callback
	const close = useCallback(() => {
		closeController && closeController();
	}, [closeController]);

	const onSaveClick = useCallback<ButtonProps['onClick']>(
		(ev): void => {
			saveDraft();
		},
		[saveDraft]
	);

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
	}, [createSnackbar, editorId]);

	const onScheduledSendClick = useCallback(
		(scheduledTime: number): void => {
			// TODO invoke pre-send (missing attachments and subject) checks
			setAutoSendTime(scheduledTime);
			saveDraft();
			close();
		},
		[close, saveDraft, setAutoSendTime]
	);

	const onSendClick = useCallback((): void => {
		// TODO invoke pre-send (missing attachments and subject) checks
		sendMessage({
			onCountdownTick: onSendCountdownTick,
			onComplete: onSendComplete,
			onError: onSendError
		});
		close();
	}, [close, onSendComplete, onSendCountdownTick, onSendError, sendMessage]);

	const onIdentityChanged = useCallback(
		(identity: IdentityDescriptor): void => {
			// TODO handle the sender in case of sendOnBehalfOf
			if (identity.right === 'sendOnBehalfOf') {
				setSender(
					createParticipantFromIdentity(
						getDefaultIdentity(account, settings),
						ParticipantRole.SENDER
					)
				);
			} else {
				setSender(undefined);
			}
			setFrom(createParticipantFromIdentity(identity, ParticipantRole.FROM));
			const textWithSignature = getMailBodyWithSignature(text, identity.defaultSignatureId);
			setText(textWithSignature);
		},
		[account, setFrom, setSender, setText, settings, text]
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

	const identitiesList = useMemo<Array<IdentityDescriptor>>(
		() => getIdentities(account, settings),
		[account, settings]
	);

	const showIdentitySelector = useMemo<boolean>(() => identitiesList.length > 1, [identitiesList]);

	const selectedIdentity = useMemo<IdentityDescriptor | null>(() => {
		let result = null;

		if (from) {
			result = getIdentityFromParticipant(from, account, settings);
		}

		return result;

		// TODO handle the sender scenario
	}, [account, from, settings]);
	const onFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = '';
			inputRef.current.click();
		}
	}, []);

	const attachmentsItems = [
		{
			id: 'localAttachment',
			icon: 'MonitorOutline',
			label: t('composer.attachment.local', 'Add from local'),
			onClick: onFileClick,
			customComponent: (
				<>
					<Icon icon="MonitorOutline" size="medium" />
					<Padding horizontal="extrasmall" />
					<Text>{t('composer.attachment.local', 'Add from local')}</Text>
				</>
			)
		}
	];

	const toggleRichTextEditor = useCallback(() => {
		setIsRichText(!isRichText);
	}, [isRichText, setIsRichText]);

	const toggleImportant = useCallback(() => {
		setIsUrgent(!isUrgent);
	}, [isUrgent, setIsUrgent]);

	const toggleReceiptRequest = useCallback(() => {
		setRequestReadReceipt(!requestReadReceipt);
	}, [requestReadReceipt, setRequestReadReceipt]);

	const addFilesFromLocal = useCallback((filesResponse) => {
		// TODO handle files response and update attachment in Editor store
	}, []);

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
	const onDragOverEvent = (event: SyntheticEvent): void => {
		event.preventDefault();
		setDropZoneEnabled(true);
	};

	// TODO complete with new attachment management
	const onDropEvent = (event: DragEvent): void => {
		event.preventDefault();
		setDropZoneEnabled(false);
		// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// // @ts-ignore
		// addAttachments(saveDraftCb, uploadAttachmentsCb, editor, event?.dataTransfer?.files).then(
		// 	(data) => {
		// 		updateEditorCb({
		// 			attach: { mp: data }
		// 		});
		// 	}
		// );
	};

	const onDragLeaveEvent = (event: DragEvent): void => {
		event.preventDefault();
		setDropZoneEnabled(false);
	};

	// TODO ask designers if the check must be performed only on TO or also on CC and BCC
	const isSendingToYourself = useMemo(() => {
		const availableAddresses = map(
			getAvailableAddresses(account, settings),
			(availableAddress) => availableAddress.address
		);
		const recipientsAddresses = map(recipients.to, (recipient) => recipient.address);

		return (
			filter(recipientsAddresses, (recipientAddress): boolean =>
				availableAddresses.includes(recipientAddress)
			).length > 0
		);
	}, [account, recipients.to, settings]);

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

	return (
		<Container
			mainAlignment="flex-start"
			crossAlignment={'flex-start'}
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
			<GapContainer mainAlignment={'flex-start'} crossAlignment={'flex-start'} gap={'large'}>
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
						<Tooltip label={sendAllowedStatus?.reason} disabled={sendAllowedStatus?.allowed}>
							<EditViewSendButtons
								onSendLater={onScheduledSendClick}
								onSendNow={onSendClick}
								disabled={!sendAllowedStatus?.allowed}
							/>
						</Tooltip>
					</GapRow>
				</GapRow>

				{/* Header end */}

				{isSendingToYourself && <WarningBanner />}

				<GapContainer
					mainAlignment={'flex-start'}
					crossAlignment={'flex-start'}
					background={'white'}
					padding={{ all: 'small' }}
					gap={'small'}
				>
					<Container mainAlignment={'flex-start'} crossAlignment={'flex-start'} height={'fit'}>
						<RecipientsRows recipients={recipients} onRecipientsChange={onRecipientsChanged} />
					</Container>
					<Input label={t('label.subject', 'Subject')} value={subject} onChange={onSubjectChange} />

					<StyledComp.RowContainer background="gray6" padding={{ all: 'small' }}>
						<StyledComp.ColContainer occupyFull>
							<EditAttachmentsBlock editorId={editorId} />
						</StyledComp.ColContainer>
					</StyledComp.RowContainer>
					<TextEditorContainer
						onDragOver={onDragOverEvent}
						onFilesSelected={noop}
						onContentChanged={onBodyChange}
						richTextMode={isRichText}
						content={text}
						minHeight={0}
						disabled={false}
					/>
					<EditViewDraftSaveInfo processStatus={draftSaveProcessStatus} />
				</GapContainer>
			</GapContainer>
		</Container>
	);
};
