/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { Container, AccordionItem } from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { Folder } from '@zextras/carbonio-shell-ui';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

export type CustomComponentProps = {
	item: {
		folder: Folder;
		items: Array<any>;
		label: string;
		id: string;
	};
};

// const openIds =

const FolderAccordionItem: FC<CustomComponentProps> = ({ item }) => {
	const { folder } = item;

	// const accordionItem = {
	// 	...folder,
	// 	onClick: () => setFolderDestination(folder),
	// 	open: openIds.includes(folder.id),
	// 	divider: true,
	// 	background: folderDestination.id === folder.id ? 'highlight' : undefined
	// };

	return (
		<ContainerEl
			orientation="vertical"
			mainAlignment="flex-start"
			minHeight="30vh"
			maxHeight="60vh"
		>
			<AccordionItem items={folder} background="gray6" />
		</ContainerEl>
	);
};

export default FolderAccordionItem;
