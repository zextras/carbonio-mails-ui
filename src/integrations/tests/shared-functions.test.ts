/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import { addBoard } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { EditViewActions } from 'constants/index';
import { openComposerWithFilesNodesSharedFunction } from 'integrations/shared-functions';
import { EditViewBoardContext } from 'views/app/detail-panel/edit/edit-view-board';
import { FileNode } from 'views/app/detail-panel/edit/editor/edit-utils-hooks/use-upload-from-files';

const generateFileNode = (): FileNode => ({
	id: faker.string.uuid(),
	name: faker.system.fileName(),
	size: faker.number.int({ min: 1, max: 100_000_000 }),
	mime_type: faker.system.mimeType(),
	__typename: 'File'
});

const getAddedBoardContext = (): EditViewBoardContext | undefined =>
	addBoard.mock.calls[0]?.[0]?.context;

describe('openComposerWithFilesNodesSharedFunction', () => {
	it('should open a new editor board with the given files nodes to add', () => {
		const filesNodes = [generateFileNode(), generateFileNode()];

		openComposerWithFilesNodesSharedFunction({ filesNodes });

		expect(addBoard).toHaveBeenCalledTimes(1);
		expect(getAddedBoardContext()).toEqual(
			expect.objectContaining<Partial<EditViewBoardContext>>({
				originAction: EditViewActions.PREFILL_COMPOSE,
				pendingFilesNodes: filesNodes
			})
		);
	});

	it('should keep only the fields of the nodes needed to add them to the editor', () => {
		const fileNode = generateFileNode();

		openComposerWithFilesNodesSharedFunction({
			filesNodes: [{ ...fileNode, owner: { id: faker.string.uuid() }, rootId: 'LOCAL_ROOT' }]
		});

		expect(getAddedBoardContext()?.pendingFilesNodes).toStrictEqual([fileNode]);
	});

	it('should discard the invalid nodes and the folders', () => {
		const fileNode = generateFileNode();
		const folderNode = { id: faker.string.uuid(), name: faker.word.noun(), __typename: 'Folder' };
		const nodeWithoutSize = { ...generateFileNode(), size: undefined };

		openComposerWithFilesNodesSharedFunction({
			filesNodes: [folderNode, fileNode, nodeWithoutSize, null, 'node']
		});

		expect(getAddedBoardContext()?.pendingFilesNodes).toStrictEqual([fileNode]);
	});

	it.each([
		['without arguments', undefined],
		['without files nodes', {}],
		['with files nodes which are not an array', { filesNodes: generateFileNode() }]
	])('should open an empty editor board if called %s', (_, args) => {
		openComposerWithFilesNodesSharedFunction(args);

		expect(addBoard).toHaveBeenCalledTimes(1);
		expect(getAddedBoardContext()).toEqual(
			expect.objectContaining<Partial<EditViewBoardContext>>({
				originAction: EditViewActions.PREFILL_COMPOSE,
				pendingFilesNodes: []
			})
		);
	});
});
