/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Types of carbonio-files-ui
 * @see https://doc.dev.zextras.com/iris/dev-docs/master/docs/modules/integrations/files
 */

/** Select nodes action target */
export type SelectNodesFunctionArgs = {
	title: string;
	confirmAction: (nodes: ArrayOneOrMore<NodeWithMetadata>) => void;
	confirmLabel: string;
	allowFolders?: boolean;
	allowFiles?: boolean;
	isValidSelection?: (node: NodeWithMetadata) => boolean;
	maxSelection?: number;
	disabledTooltip?: string;
	canSelectOpenedFolder?: boolean;
	description?: string;
	canCreateFolder?: boolean;
};

/** Array with at least one item of type T */
export type ArrayOneOrMore<T> = [T] & T[];

/** Definition of NodeType enumerator. This is used for discriminating the specific type of a node */
enum NodeType {
	Application = 'APPLICATION',
	Audio = 'AUDIO',
	Folder = 'FOLDER',
	Image = 'IMAGE',
	Message = 'MESSAGE',
	Other = 'OTHER',
	Presentation = 'PRESENTATION',
	Root = 'ROOT',
	Spreadsheet = 'SPREADSHEET',
	Text = 'TEXT',
	Video = 'VIDEO'
}

export type NodeWithMetadata = {
	id: string;
	name: string;
	type: NodeType;
	permissions?: {
		can_read: boolean;
		can_write_file: boolean;
		can_write_folder: boolean;
	};
} & (
	| {
			__typename?: 'File';
			size: number;
			mime_type: string;
			extension?: string | null;
			version: number;
	  }
	| {
			__typename?: 'Folder';
	  }
);
