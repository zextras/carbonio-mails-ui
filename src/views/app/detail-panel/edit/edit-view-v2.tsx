/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';

import {
	Container,
	ContainerProps,
	getPadding,
	Input,
	Text
} from '@zextras/carbonio-design-system';
import { useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import styled, { DefaultTheme, SimpleInterpolation } from 'styled-components';

import { EditViewIdentitySelector } from './parts/edit-view-identity-selector';
import { TextEditorContainer, TextEditorContent } from './parts/text-editor-container-v2';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import {
	getIdentities,
	getIdentityFromParticipant,
	IdentityDescriptor
} from '../../../../helpers/identities';
import {
	useAddDraftListeners,
	useEditorFrom,
	useEditorIsRichText,
	useEditorSender,
	useEditorSubject,
	useEditorText
} from '../../../../store/zustand/editor';
import { DraftSaveEndListener, DraftSaveStartListener, Participant } from '../../../../types';

const StyledGapContainer = styled(Container)<
	ContainerProps & { gap?: keyof DefaultTheme['sizes']['padding'] }
>`
	gap: ${({ theme, gap }): SimpleInterpolation => gap && getPadding(gap, theme)};
`;

export type EditViewProp = {
	editorId: string;
};
//
// const editor = generateEditor(noop, 'new');
// editor.subject = 'Pluto';
//
// useEditorsStore.getState().addEditor(editor?.id, editor);

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

	// console.count('render');
	// console.log('editorId', editorId);
	// console.log('subject', subject);
	// const state1 = useEditorsStore.getState();
	// console.dir(state1);
	const [tempSaveDraftStatus, setTempSaveDraftStatus] = useState('');

	const onIdentityChanged = useCallback(
		(identity: IdentityDescriptor): void => {
			console.log('**** identity changed', identity);
			setFrom(createParticipantFromIdentity(identity, ParticipantRole.FROM));

			// TODO handle the sender in case of sendOnBehalfOf

			// TODO change signature accordingly
		},
		[setFrom]
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
		console.log('Save draft started....');
		setTempSaveDraftStatus('Save draft started....');
	}, []);

	const onDraftSaveEnd = useCallback<DraftSaveEndListener>(({ editorId: string, result }) => {
		console.log('Save draft ended');
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

		console.log('**** selected identity is', result);

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
			<StyledGapContainer mainAlignment={'flex-start'} crossAlignment={'flex-start'} gap={'large'}>
				<EditViewIdentitySelector
					selected={selectedIdentity}
					identities={identitiesList}
					onIdentitySelected={onIdentityChanged}
				/>

				<StyledGapContainer
					mainAlignment={'flex-start'}
					crossAlignment={'flex-start'}
					background={'white'}
					padding={{ all: 'small' }}
					gap={'small'}
				>
					<Container mainAlignment={'flex-start'} crossAlignment={'flex-start'} height={'fit'}>
						<Text>Recipients</Text>
					</Container>
					<Input label={'temp subject'} value={subject} onChange={onSubjectChange}></Input>
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
				</StyledGapContainer>
			</StyledGapContainer>
		</Container>
	);
};
