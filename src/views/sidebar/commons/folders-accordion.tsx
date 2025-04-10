/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
	Accordion as MUIAccordion,
	Container as MUIContainer,
	AccordionSummary as MUIAccordionSummary,
	AccordionDetails as MUIAccordionDetails
} from '@mui/material';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { theme } from '../../../carbonio-ui-commons/theme/theme-mui';
import { hasId } from '../../../carbonio-ui-commons/worker/handle-message';
import { Folder } from '../../../types';

type FolderAccordionProps = {
	folders: Array<Folder>;
	onFolderSelected: (arg: Folder) => void;
	selectedFolderId?: string;
	allowRootSelection: boolean;
	FolderAccordionCustomComponent: React.FC<{ folder: Folder }>;
};

export const FoldersAccordion = ({
	folders,
	onFolderSelected,
	FolderAccordionCustomComponent,
	selectedFolderId,
	allowRootSelection
}: FolderAccordionProps): React.JSX.Element => {
	const [openIds, setOpenIds] = useState<Array<string>>([FOLDERS.USER_ROOT]);

	return (
		<MUIContainer disableGutters>
			{folders.map((folder) => (
				<MUIAccordion
					disableGutters
					slotProps={{ transition: { unmountOnExit: true } }}
					expanded={openIds.includes(folder.id)}
					key={folder.id}
				>
					<MUIAccordionSummary
						onClick={(): void => {
							onFolderSelected?.(folder);
						}}
						expandIcon={
							folder?.children?.length > 0 &&
							!hasId(folder, 'all') && (
								<ExpandMoreIcon
									color="primary"
									onClick={(e): void => {
										e.preventDefault();
										setOpenIds((state: Array<string>) =>
											state.includes(folder.id)
												? state.filter((id) => id !== folder.id)
												: [...state, folder.id]
										);
									}}
								/>
							)
						}
						aria-controls="panel1a-content"
						id={folder.id}
						sx={{
							margin: 0,
							backgroundColor:
								folder.id === selectedFolderId
									? theme.palette.highlight.hover
									: theme.palette.gray6.regular,
							'&:hover': {
								backgroundColor:
									folder.id === selectedFolderId
										? theme.palette.highlight.active
										: theme.palette.gray6.hover
							}
						}}
					>
						<FolderAccordionCustomComponent folder={folder} />
					</MUIAccordionSummary>
					{folder?.children?.length > 0 && (
						<MUIAccordionDetails>
							<FoldersAccordion
								folders={folder.children}
								selectedFolderId={selectedFolderId}
								key={folder.id}
								allowRootSelection={allowRootSelection}
								FolderAccordionCustomComponent={FolderAccordionCustomComponent}
								onFolderSelected={onFolderSelected}
							/>
						</MUIAccordionDetails>
					)}
				</MUIAccordion>
			))}
		</MUIContainer>
	);
};
