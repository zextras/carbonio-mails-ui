/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';

import { Container, Input, Text } from '@zextras/carbonio-design-system';
import { t, useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { EditViewIdentitySelector } from './parts/edit-view-identity-selector';
import { RecipientsRows } from './parts/recipients-rows';
import { TextEditorContainer, TextEditorContent } from './parts/text-editor-container-v2';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { GapContainer } from '../../../../commons/gap-container';
import {
	getIdentities,
	getIdentityFromParticipant,
	IdentityDescriptor
} from '../../../../helpers/identities';
import { getMailBodyWithSignature } from '../../../../helpers/signatures';
import {
	useAddDraftListeners,
	useEditorFrom,
	useEditorIsRichText,
	useEditorRecipients,
	useEditorSender,
	useEditorSubject,
	useEditorText
} from '../../../../store/zustand/editor';
import {
	DraftSaveEndListener,
	DraftSaveStartListener,
	EditorRecipients,
	Participant
} from '../../../../types';

export type EditViewProp = {
	editorId: string;
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

export const EditView: FC<EditViewProp> = ({ editorId }) => {
	const account = useUserAccount();
	const settings = useUserSettings();

	const { subject, setSubject } = useEditorSubject(editorId);
	const { isRichText, setIsRichText } = useEditorIsRichText(editorId);
	const { text, setText } = useEditorText(editorId);
	const { from, setFrom } = useEditorFrom(editorId);
	const { sender, setSender } = useEditorSender(editorId);
	const { recipients, setRecipients } = useEditorRecipients(editorId);

	const [tempSaveDraftStatus, setTempSaveDraftStatus] = useState('');

	console.count('**** edit view render');

	const onIdentityChanged = useCallback(
		(identity: IdentityDescriptor): void => {
			setFrom(createParticipantFromIdentity(identity, ParticipantRole.FROM));
			const textWithSignature = getMailBodyWithSignature(text, identity.defaultSignatureId);

			setText(textWithSignature);
			// TODO handle the sender in case of sendOnBehalfOf

			// TODO change signature accordingly
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

	const onDraftSaveStart = useCallback<DraftSaveStartListener>(({ editorId: string }) => {
		setTempSaveDraftStatus('Save draft started....');
	}, []);

	const onDraftSaveEnd = useCallback<DraftSaveEndListener>(({ editorId: string, result }) => {
		setTempSaveDraftStatus(
			`Save draft ended at ${new Date().toLocaleTimeString()} with result ${JSON.stringify(result)}`
		);
	}, []);

	useAddDraftListeners({
		editorId,
		saveStartListener: onDraftSaveStart,
		saveEndListener: onDraftSaveEnd
	});

	const identitiesList = useMemo<Array<IdentityDescriptor>>(
		() => getIdentities(account, settings),
		[account, settings]
	);

	const selectedIdentity = useMemo<IdentityDescriptor | null>(() => {
		let result = null;

		if (from) {
			result = getIdentityFromParticipant(from, account, settings);
		}

		return result;

		// TODO handle the sender scenario
	}, [account, from, settings]);

	return (
		<Container
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			padding={{ all: 'large' }}
			background={'gray5'}
		>
			<GapContainer mainAlignment={'flex-start'} crossAlignment={'flex-start'} gap={'large'}>
				<EditViewIdentitySelector
					selected={selectedIdentity}
					identities={identitiesList}
					onIdentitySelected={onIdentityChanged}
				/>

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
					<Text>draft status: {tempSaveDraftStatus}</Text>
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
				</GapContainer>
			</GapContainer>
		</Container>
	);
};
