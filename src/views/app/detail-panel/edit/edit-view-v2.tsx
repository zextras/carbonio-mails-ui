/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ChangeEvent, FC, useCallback, useMemo } from 'react';

import {
	Container,
	Input,
	Text,
	Button,
	Dropdown,
	IconButton,
	Tooltip,
	ButtonProps
} from '@zextras/carbonio-design-system';
import { t, useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { useSendCountdown } from './edit-utils-hooks/use-send-countdown';
import { EditViewDraftSaveInfo } from './parts/edit-view-draft-save-info';
import { EditViewIdentitySelector } from './parts/edit-view-identity-selector';
import { EditViewSendButtons } from './parts/edit-view-send-buttons';
import { RecipientsRows } from './parts/recipients-rows';
import { TextEditorContainer, TextEditorContent } from './parts/text-editor-container-v2';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { GapContainer, GapRow } from '../../../../commons/gap-container';
import {
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
	useEditorText
} from '../../../../store/zustand/editor';
import { EditorRecipients, Participant } from '../../../../types';

export type EditViewProp = {
	editorId: string;
	onClose: () => void;
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

export const EditView: FC<EditViewProp> = ({ editorId, onClose }) => {
	const account = useUserAccount();
	const settings = useUserSettings();

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
	useSendCountdown(editorId);

	console.count('**** edit view render');

	// Performs cleanups and invoke the external callback
	const close = useCallback(() => {
		onClose();
	}, [onClose]);

	const onSaveClick = useCallback<ButtonProps['onClick']>(
		(ev): void => {
			saveDraft();
		},
		[saveDraft]
	);

	const onScheduledSendClick = useCallback(
		(scheduledTime: number): void => {
			setAutoSendTime(scheduledTime);
			saveDraft();
			close();
		},
		[setAutoSendTime]
	);

	const onSendClick = useCallback((): void => {
		sendMessage();
	}, [sendMessage]);

	const onIdentityChanged = useCallback(
		(identity: IdentityDescriptor): void => {
			// TODO handle the sender in case of sendOnBehalfOf
			setFrom(createParticipantFromIdentity(identity, ParticipantRole.FROM));
			const textWithSignature = getMailBodyWithSignature(text, identity.defaultSignatureId);
			setText(textWithSignature);
		},
		[setFrom, setText, text]
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

	const toggleRichTextEditor = useCallback(() => {
		setIsRichText(!isRichText);
	}, [isRichText, setIsRichText]);

	const toggleImportant = useCallback(() => {
		setIsUrgent(!isUrgent);
	}, [isUrgent, setIsUrgent]);

	const toggleReceiptRequest = useCallback(() => {
		setRequestReadReceipt(!requestReadReceipt);
	}, [requestReadReceipt, setRequestReadReceipt]);

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
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			padding={{ all: 'large' }}
			background={'gray5'}
		>
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
						{/* <AddAttachmentDropdown editorId={editorId} onFilesSelected={(files) => addAttachments()} onPublicUrlCreated={} onFilesFilesSelected={} /> */}

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
					<Input
						label={t('label.subject', 'Subject')}
						value={subject}
						onChange={onSubjectChange}
					></Input>
					<Container mainAlignment={'flex-start'} crossAlignment={'flex-start'} height={'fit'}>
						<Text>Attachments</Text>
					</Container>
					<TextEditorContainer
						onDragOver={noop}
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
