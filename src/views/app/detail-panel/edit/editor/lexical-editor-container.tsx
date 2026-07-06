/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import { $generateHtmlFromNodes } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $getRoot, type EditorState, type LexicalEditor } from 'lexical';

import { InitialContentPlugin } from './plugins/initial-content-plugin';
import { ToolbarPlugin } from './plugins/toolbar-plugin';
import { useEditorSetDirty } from 'store/editor/hooks/statuses';
import { useEditorText } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

export const SAVE_EDITOR_DELAY = 2000;

type LexicalEditorContainerProps = {
	editorId: MailsEditorV2['id'];
};

const LexicalWrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;

	.editor-inner {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.mails-lexical-content-editable {
		flex: 1;
		min-height: 12.5rem;
		padding: 0.5rem;
		outline: none;
		overflow-y: auto;
	}

	.mails-lexical-placeholder {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		color: ${({ theme }): string => theme.palette.secondary.regular};
		pointer-events: none;
		user-select: none;
	}

	.mails-lexical-bold {
		font-weight: bold;
	}

	.mails-lexical-italic {
		font-style: italic;
	}

	.mails-lexical-underline {
		text-decoration: underline;
	}
`;

export const LexicalEditorContainer = ({
	editorId
}: LexicalEditorContainerProps): React.JSX.Element => {
	const { getText, setText } = useEditorText(editorId);
	const { setDirty } = useEditorSetDirty(editorId);

	const initialHtml = useMemo(() => getText().richText, [getText]);

	const timeoutId = useRef<ReturnType<typeof setTimeout>>();
	const latestChange = useRef<{ editorState: EditorState; editor: LexicalEditor }>();

	const saveToStore = useCallback(
		(editorState: EditorState, editor: LexicalEditor): void => {
			// Read with the editor bound as active context: `$generateHtmlFromNodes`
			// -> `exportDOM` needs it.
			editorState.read(
				() => {
					const richText = $generateHtmlFromNodes(editor, null);
					const plainText = $getRoot().getTextContent();
					setText({ plainText, richText }, { syncTextProvider: false });
				},
				{ editor }
			);
		},
		[setText]
	);

	const onChange = useCallback(
		(editorState: EditorState, editor: LexicalEditor): void => {
			latestChange.current = { editorState, editor };
			setDirty();
			if (timeoutId.current) {
				clearTimeout(timeoutId.current);
			}
			timeoutId.current = setTimeout(() => {
				saveToStore(editorState, editor);
			}, SAVE_EDITOR_DELAY);
		},
		[saveToStore, setDirty]
	);

	// Flush any pending change on unmount so toggling editors does not drop the
	// last edits made within the debounce window.
	const saveRef = useRef(saveToStore);
	saveRef.current = saveToStore;
	useEffect(
		() => (): void => {
			if (timeoutId.current) {
				clearTimeout(timeoutId.current);
			}
			if (latestChange.current) {
				saveRef.current(latestChange.current.editorState, latestChange.current.editor);
			}
		},
		[]
	);

	const initialConfig = useMemo(
		() => ({
			namespace: 'MailsLexicalEditor',
			nodes: [],
			theme: {
				text: {
					bold: 'mails-lexical-bold',
					italic: 'mails-lexical-italic',
					underline: 'mails-lexical-underline'
				}
			},
			onError: (error: Error): void => {
				throw error;
			}
		}),
		[]
	);

	return (
		<Container
			data-testid="LexicalEditorContainer"
			height="100%"
			background="gray6"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
		>
			<LexicalComposer initialConfig={initialConfig}>
				<LexicalWrapper>
					<ToolbarPlugin />
					<div className="editor-inner">
						<RichTextPlugin
							contentEditable={<ContentEditable className="mails-lexical-content-editable" />}
							placeholder={
								<div className="mails-lexical-placeholder">
									{t('messages.write_your_message', 'Write your message')}
								</div>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
					</div>
					<HistoryPlugin />
					<OnChangePlugin onChange={onChange} />
					<InitialContentPlugin html={initialHtml} />
				</LexicalWrapper>
			</LexicalComposer>
		</Container>
	);
};
