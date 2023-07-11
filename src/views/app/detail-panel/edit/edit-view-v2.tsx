/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Avatar,
	Container,
	ContainerProps,
	Dropdown,
	getPadding,
	IconButton,
	Input,
	Row,
	Text,
	Theme,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';
import styled, { DefaultTheme, SimpleInterpolation } from 'styled-components';
import {
	ParticipantRole,
	ParticipantRoleType
} from '../../../../carbonio-ui-commons/constants/participants';
import {
	getIdentities,
	getIdentityFromParticipant,
	Identity
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
import { EditViewIdentitySelector } from './parts/edit-view-identiy-selector';
import {
	TextEditorContainer,
	TextEditorContainerProps,
	TextEditorContent
} from './parts/text-editor-container-v2';

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
	identity: Identity,
	type: typeof ParticipantRole.FROM | typeof ParticipantRole.SENDER
): Participant =>
	({
		type,
		address: identity.fromAddress,
		name: identity.identityName,
		fullName: identity.displayName ?? identity.identityName
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

	const onIdentityChanged = useCallback((identity: Identity): void => {
		console.log('**** identity changed', identity);
		setFrom(createParticipantFromIdentity(identity, ParticipantRole.FROM));

		// TODO handle the sender in case of sendOnBehalfOf

		// TODO change signature accordingly
	}, []);

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

	const identitiesList = useMemo<Array<Identity>>(
		() => getIdentities(account, settings),
		[account, settings]
	);

	const selectedIdentity = useMemo<Identity | null>(() => {
		if (from) {
			return getIdentityFromParticipant(from, account, settings);
		}

		return null;

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
				<Text>Header</Text>
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
