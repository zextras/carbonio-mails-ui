/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Avatar,
	Container,
	ContainerProps, Dropdown,
	getPadding, IconButton,
	Input, Row,
	Text,
	Theme, Tooltip,
} from '@zextras/carbonio-design-system';
import { noop } from 'lodash';
import React, { ChangeEvent, FC, useCallback, useState } from 'react';
import styled, { DefaultTheme, SimpleInterpolation } from 'styled-components';
import {
	useAddDraftListeners,
	useEditorIsRichText,
	useEditorSubject,
	useEditorText
} from '../../../../store/zustand/editor';
import { DraftSaveEndListener, DraftSaveStartListener } from '../../../../types';
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

export const EditView: FC<EditViewProp> = ({ editorId }) => {
	const { subject, setSubject } = useEditorSubject(editorId);
	const { isRichText, setIsRichText } = useEditorIsRichText(editorId);
	const { text, setText } = useEditorText(editorId);

	// console.count('render');
	// console.log('editorId', editorId);
	// console.log('subject', subject);
	// const state1 = useEditorsStore.getState();
	// console.dir(state1);
	const [tempSaveDraftStatus, setTempSaveDraftStatus] = useState('');

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

	return (
		<Container
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			padding={{ all: 'large' }}
			background={'gray5'}
		>
			<StyledGapContainer mainAlignment={'flex-start'} crossAlignment={'flex-start'} gap={'large'}>
				<Text>Header</Text>
				<FromItem orientation="horizontal" mainAlignment="space-between">
					<Tooltip label={activeFrom?.label} maxWidth="100%" placement="top-start">
						<Dropdown
							// eslint-disable-next-line @typescript-eslint/ban-ts-commentg
							// @ts-ignore
							items={identitiesList.map((identity, index) => ({
								...identity,
								id: index
							}))}
							width="fit"
							maxWidth="100%"
							forceOpen={open}
							onClose={onFromDropdownClose}
							selectedBackgroundColor="highlight"
							data-testid="from-dropdown"
							onSelect={(}
						>
							<Row
								onClick={toggleOpen}
								width="100%"
								orientation="horizontal"
								height="fit"
								wrap="nowrap"
								padding={{ all: 'small' }}
							>
								<Avatar label={from?.displayName || from?.fullName || noName} />
								<Container
									width="100%"
									crossAlignment="flex-start"
									height="fit"
									padding={{ left: 'medium', right: 'medium' }}
								>
									<Text weight="bold" data-testid="from-identity-display-name">
										{from?.displayName || from?.fullName || from?.address}
									</Text>
									<Text color="gray1" size="small" data-testid="from-identity-address">
										{from?.address}
									</Text>
								</Container>
								<IconButton
									icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'}
									onClick={(): null => null}
								/>
							</Row>
						</Dropdown>
					</Tooltip>
				</FromItem>
				)}

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
