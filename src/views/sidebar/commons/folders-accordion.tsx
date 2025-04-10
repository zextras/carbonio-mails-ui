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
import { useParams } from 'react-router-dom';

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
	const { folderId } = useParams() as { folderId: string };
	const [openIds, setOpenIds] = useState<Array<string>>([FOLDERS.USER_ROOT]);

	return (
		<MUIContainer disableGutters>
			{folders.map((accordion) => (
				<MUIAccordion
					disableGutters
					slotProps={{ transition: { unmountOnExit: true } }}
					expanded={openIds.includes(accordion.id)}
					key={accordion.id}
				>
					<MUIAccordionSummary
						onClick={(): void => {
							onFolderSelected?.(accordion);
						}}
						expandIcon={
							accordion?.children?.length > 0 &&
							!hasId(accordion, 'all') && (
								<ExpandMoreIcon
									color="primary"
									onClick={(e): void => {
										e.preventDefault();
										setOpenIds((state: Array<string>) =>
											state.includes(accordion.id)
												? state.filter((id) => id !== accordion.id)
												: [...state, accordion.id]
										);
									}}
								/>
							)
						}
						aria-controls="panel1a-content"
						id={accordion.id}
						sx={{
							margin: 0,
							backgroundColor:
								accordion.id === folderId
									? theme.palette.highlight.hover
									: theme.palette.gray6.regular,
							'&:hover': {
								backgroundColor:
									accordion.id === folderId
										? theme.palette.highlight.active
										: theme.palette.gray6.hover
							}
						}}
					>
						<FolderAccordionCustomComponent folder={accordion} />
					</MUIAccordionSummary>
					{accordion?.children?.length > 0 && (
						<MUIAccordionDetails>
							<FoldersAccordion
								folders={accordion.children}
								selectedFolderId={selectedFolderId}
								key={accordion.id}
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
