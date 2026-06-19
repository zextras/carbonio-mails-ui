/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useState } from 'react';

import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { Modal, TextArea } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $getRoot, $insertNodes, type LexicalEditor } from 'lexical';

type SourceCodeModalProps = {
	editor: LexicalEditor;
	open: boolean;
	onClose: () => void;
};

/**
 * Modal that exposes the editor content as raw HTML, mirroring the legacy
 * TinyMCE "source code" dialog. On open the current content is serialized to
 * HTML; on confirm the (possibly edited) HTML is parsed back and replaces the
 * editor content, which propagates to the store through the regular change
 * handler.
 */
export const SourceCodeModal = ({
	editor,
	open,
	onClose
}: SourceCodeModalProps): React.JSX.Element => {
	const [source, setSource] = useState('');

	// Serialize the editor content to HTML each time the modal is opened so the
	// textarea always reflects the latest state.
	useEffect(() => {
		if (open) {
			editor.read(() => {
				setSource($generateHtmlFromNodes(editor, null));
			});
		}
	}, [editor, open]);

	const onConfirm = useCallback(() => {
		editor.update(() => {
			const dom = new DOMParser().parseFromString(source, 'text/html');
			const nodes = $generateNodesFromDOM(editor, dom);
			const root = $getRoot();
			root.clear();
			root.select();
			$insertNodes(nodes);
		});
		onClose();
	}, [editor, source, onClose]);

	return (
		<Modal
			open={open}
			title={t('label.source_code', 'Source code')}
			size="large"
			onClose={onClose}
			onConfirm={onConfirm}
			confirmLabel={t('label.save', 'Save')}
			showCloseIcon
			onSecondaryAction={onClose}
			secondaryActionLabel={t('label.cancel', 'Cancel')}
		>
			<TextArea
				value={source}
				onChange={(event): void => setSource(event.target.value)}
				maxHeight="60vh"
				style={{ fontFamily: 'monospace', minHeight: '20rem' }}
			/>
		</Modal>
	);
};
