/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { $createCodeNode, CodeHighlightNode, CodeNode } from '@lexical/code-core';
import { registerCodeHighlighting } from '@lexical/code-shiki';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { Modal } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $createTextNode, $getRoot, $insertNodes, type LexicalEditor } from 'lexical';

type SourceCodeModalProps = {
	editor: LexicalEditor;
	open: boolean;
	onClose: () => void;
};

const CodeViewWrapper = styled.div`
	height: 60vh;
	overflow: auto;
	border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	border-radius: 0.25rem;
	background: ${({ theme }): string => theme.palette.gray6.regular};

	.mails-source-code,
	.mails-source-code-editable {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.8125rem;
		line-height: 1.5;
		tab-size: 2;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.mails-source-code-editable {
		outline: none;
		padding: 0.5rem;
		min-height: 100%;
		box-sizing: border-box;
		color: ${({ theme }): string => theme.palette.text.regular};
	}
`;

/**
 * Loads the given HTML into a code block and registers Shiki-based syntax
 * highlighting on it (token colors are applied as inline styles from the
 * tokenizer's theme). Building the content inside an `editor.update` (after
 * registration) marks the node dirty so the highlight transform runs.
 */
const CodeHighlightPlugin = ({ html }: { html: string }): null => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const unregister = registerCodeHighlighting(editor);
		editor.update(() => {
			const root = $getRoot();
			root.clear();
			const codeNode = $createCodeNode('html');
			codeNode.append($createTextNode(html));
			root.append(codeNode);
		});
		return unregister;
	}, [editor, html]);

	return null;
};

/**
 * Modal that exposes the editor content as editable, syntax-highlighted HTML
 * (rendered through a dedicated Lexical code instance), mirroring the legacy
 * TinyMCE "source code" dialog. On save the edited source is parsed back into
 * the main editor.
 */
export const SourceCodeModal = ({
	editor,
	open,
	onClose
}: SourceCodeModalProps): React.JSX.Element => {
	const [source, setSource] = useState('');
	const sourceEditorRef = useRef<LexicalEditor | null>(null);

	// Serialize the editor content to HTML each time the modal is opened so the
	// view always reflects the latest state.
	useEffect(() => {
		if (open) {
			editor.read(() => {
				setSource($generateHtmlFromNodes(editor, null));
			});
		}
	}, [editor, open]);

	const initialConfig = useMemo(
		() => ({
			namespace: 'MailsSourceCodeEditor',
			nodes: [CodeNode, CodeHighlightNode],
			theme: { code: 'mails-source-code' },
			onError: (error: Error): void => {
				throw error;
			}
		}),
		[]
	);

	// Read the edited HTML out of the code editor and parse it back into the main
	// editor, replacing its content (the change then propagates to the store via
	// the regular change handler).
	const onConfirm = useCallback(() => {
		const sourceEditor = sourceEditorRef.current;
		if (sourceEditor) {
			const html = sourceEditor.getEditorState().read(() => $getRoot().getTextContent());
			editor.update(() => {
				const dom = new DOMParser().parseFromString(html, 'text/html');
				const nodes = $generateNodesFromDOM(editor, dom);
				const root = $getRoot();
				root.clear();
				root.select();
				$insertNodes(nodes);
			});
		}
		onClose();
	}, [editor, onClose]);

	return (
		<Modal
			open={open}
			title={t('label.source_code', 'Source code')}
			size="large"
			minHeight="75vh"
			maxHeight="90vh"
			onClose={onClose}
			onConfirm={onConfirm}
			confirmLabel={t('label.save', 'Save')}
			onSecondaryAction={onClose}
			secondaryActionLabel={t('label.cancel', 'Cancel')}
			showCloseIcon
		>
			<CodeViewWrapper>
				{/* `source` keys the composer so reopening rebuilds it with fresh content */}
				<LexicalComposer key={source} initialConfig={initialConfig}>
					<PlainTextPlugin
						contentEditable={<ContentEditable className="mails-source-code-editable" />}
						placeholder={null}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<CodeHighlightPlugin html={source} />
					<EditorRefPlugin editorRef={sourceEditorRef} />
				</LexicalComposer>
			</CodeViewWrapper>
		</Modal>
	);
};
