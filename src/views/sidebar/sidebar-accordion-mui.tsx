/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Container } from '@mui/material';
import { Folder, useLocalStorage } from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback, useRef } from 'react';
import { theme } from '../../theme/theme-mui';
import AccordionCustomComponent from './accordion-custom-component';
import { ButtonFindShares } from './button-find-shares';

export const SidebarAccordionMui: FC<{ accordions: Array<Folder>; folderId: string }> = ({
	accordions,
	folderId
}) => {
	const [openIds, setOpenIds] = useLocalStorage<Array<string>>('open_mails_folders', []);
	const sidebarRef = useRef<HTMLInputElement>(null);

	const onClick = useCallback(
		(accordion: Folder, expanded: boolean): void => {
			if (expanded) {
				setOpenIds((state: Array<string>) =>
					state.includes(accordion.id) ? state : [...state, accordion.id]
				);
			} else {
				setOpenIds((state: Array<string>) => state.filter((id) => id !== accordion.id));
			}
		},
		[setOpenIds]
	);

	return (
		<Container ref={sidebarRef} disableGutters>
			{accordions.map((accordion) =>
				accordion.id === 'find_shares' ? (
					<ButtonFindShares key={accordion.id} />
				) : (
					<Accordion
						disableGutters
						TransitionProps={{ unmountOnExit: true }}
						expanded={openIds.includes(accordion.id)}
					>
						<AccordionSummary
							expandIcon={
								accordion.children.length > 0 && (
									<ExpandMoreIcon
										color="primary"
										onClick={(e): void => {
											e.preventDefault();
											onClick(accordion, !openIds.includes(accordion.id));
										}}
									/>
								)
							}
							aria-controls="panel1a-content"
							id={accordion.id}
							sx={{
								backgroundColor:
									accordion.id === folderId
										? theme.palette.highlight.hover
										: theme.palette.gray5.regular,
								'&:hover': {
									backgroundColor:
										accordion.id === folderId
											? theme.palette.highlight.active
											: theme.palette.gray5.hover
								}
							}}
						>
							<AccordionCustomComponent item={accordion} />
						</AccordionSummary>
						{accordion.children.length > 0 && (
							<AccordionDetails>
								<SidebarAccordionMui
									accordions={accordion.children}
									folderId={folderId}
									key={accordion.id}
								/>
							</AccordionDetails>
						)}
					</Accordion>
				)
			)}
		</Container>
	);
};
