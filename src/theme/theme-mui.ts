/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createTheme } from '@mui/material';

export const themeMui = createTheme({
	components: {
		MuiSvgIcon: {
			styleOverrides: {
				root: {
					color: '#333333',
					'&:hover': { background: '#c8cfd8' },
					fontSize: '20px',
					padding: '2px',
					fontWeight: 400
				}
			}
		},
		MuiAccordionSummary: {
			styleOverrides: {
				root: {
					padding: '0 16px 0 0',
					margin: '0px',
					minHeight: '0px'
				},
				focusVisible: {
					background: 'blue'
				},
				content: {
					margin: '0px'
				}
			}
		},
		MuiAccordionDetails: {
			styleOverrides: {
				root: {
					padding: '0 0 0 8px',
					margin: '0px'
				}
			}
		},
		MuiButtonBase: {
			styleOverrides: {
				root: {
					padding: '0px'
				}
			}
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderBottomLeftRadius: '0px',
					borderTopLeftRadius: '0px',
					borderBottomRightRadius: '0px',
					borderTopRightRadius: '0px'
				}
			}
		},
		MuiAccordion: {
			styleOverrides: {
				root: {
					':last-of-type': {
						borderBottomLeftRadius: '0px',
						borderTopLeftRadius: '0px',
						borderBottomRightRadius: '0px',
						borderTopRightRadius: '0px'
					},
					':first-of-type': {
						borderBottomLeftRadius: '0px',
						borderTopLeftRadius: '0px',
						borderBottomRightRadius: '0px',
						borderTopRightRadius: '0px'
					},
					boxShadow: 'none',
					background: '#f5f6f8'
				}
			}
		}
	}
});
