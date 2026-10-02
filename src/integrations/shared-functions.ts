/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { pick } from 'lodash';

import { EditViewActions } from 'constants/index';
import { EditorPrefillData } from 'types/editor';
import { Participant } from 'types/participant';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';
import {
	FileNode,
	isValidFileNode
} from 'views/app/detail-panel/edit/editor/edit-utils-hooks/use-upload-from-files';

export const mailToSharedFunction: (recipients: Array<Participant>, subject?: string) => void = (
	recipients,
	subject
) => {
	createEditBoard({
		action: EditViewActions.MAIL_TO,
		compositionData: {
			recipients,
			subject
		}
	});
};

export const openComposerSharedFunction: (
	onConfirm: () => void,
	compositionData: EditorPrefillData,
	...rest: never[]
) => void = (onConfirm, compositionData, ...rest) => {
	createEditBoard({
		action: EditViewActions.COMPOSE,
		onConfirm,
		compositionData
	});
};

// function used to open a new mail editor board with prefilled fields set by other modules
export const openPrefilledComposerSharedFunction: (
	editorPrefillData?: EditorPrefillData,
	...rest: never[]
) => void = (editorPrefillData, ...rest) => {
	createEditBoard({
		action: EditViewActions.PREFILL_COMPOSE,
		compositionData: editorPrefillData
	});
};

/*
 * Function used by other modules (Files) to open a new mail editor board and add the given Files
 * nodes to it, as attachments or as smart links if they do not fit the max message size.
 * The argument comes from another module, so it is validated and only the files are kept
 */
export const openComposerWithFilesNodesSharedFunction = (args?: { filesNodes?: unknown }): void => {
	const filesNodes = Array.isArray(args?.filesNodes)
		? args.filesNodes
				.filter(isValidFileNode)
				.filter((fileNode) => fileNode.__typename === 'File')
				.map<FileNode>((fileNode) =>
					pick(fileNode, ['id', 'name', 'size', 'mime_type', '__typename'])
				)
		: [];

	createEditBoard({
		action: EditViewActions.PREFILL_COMPOSE,
		filesNodes
	});
};
