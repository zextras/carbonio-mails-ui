/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconCheckbox, Row } from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

export const FileInput = styled.input`
	display: none;
`;

export const Divider = styled.div`
	width: 100%;
	min-height: 0.0625rem;
	max-height: 0.0625rem;
	border-bottom: 0.0625rem solid ${(props): string => props.theme.palette.gray2.regular};
`;

export const ResizedIconCheckbox = styled(IconCheckbox)`
	[class^='Padding__Comp'] {
		padding: 0.375rem;
		svg {
			height: 1.25rem;
			width: 1.25rem;
		}
	}
`;

export const TextArea = styled.textarea`
	box-sizing: border-box;
	min-height: 15.625rem;

	flex-grow: 1;
	width: 100%;
	border: none;
	resize: vertical;
	& :focus,
	:active {
		box-shadow: none;
		border: none;
		outline: none;
	}
`;

export const EditorWrapper = styled.div`
	width: 100%;
	height: auto;
	position: relative;

	> .tox:not(.tox-tinymce-inline) {
		width: 100%;
		border: none;
		.tox-editor-container {
			min-height: 18.75rem;
		}
		.tox-editor-header {
			padding: ${(props): string => props.theme.sizes.padding.large};
			background-color: ${(props): string => props.theme.palette.gray6.regular};
		}
		.tox-toolbar__primary {
			background: none;
			background-color: ${(props): string => props.theme.palette.gray4.regular};
			border-radius: ${(props): string => props.theme.borderRadius};
		}
	}
	> .tox {
		.tox-edit-area {
			margin-left: calc(-1rem + ${(props): string => props.theme.sizes.padding.large});
			overflow-y: auto;
			max-height: 100%;
		}
		.tox-edit-area__iframe {
			height: 100%;
			padding-bottom: ${(props): string => props.theme.sizes.padding.large};
		}
		&.tox-tinymce {
			height: 100% !important;
		}
	}
`;

export const BannerContainer = styled(Container).attrs(() => ({
	bottomBorderColor: undefined
}))<{ $bottomBorderColor: keyof DefaultTheme['palette'] }>`
	border-bottom: 0.0625rem solid
		${({ theme, $bottomBorderColor }): string => theme.palette[$bottomBorderColor].regular};
	border-top-right-radius: 0.25rem;
	border-top-left-radius: 0.25rem;
	padding: 1rem;
`;

export const RowContainer = styled(Container)`
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	grid-gap: 0.5rem;
	height: fit-content;
`;

export const ColContainer = styled.div`
	grid-column: ${({ occupyFull }: { occupyFull: boolean }): string =>
		`span  ${occupyFull ? 12 : 6}`};
`;

export const StickyTime = styled(Row)`
	position: relative;
	bottom: 2.375rem;
	right: -0.125rem;
`;

export const StickyTimeContainer = styled(Row)`
	position: sticky;
	bottom: 0.625rem;
	right: 0.625rem;
	height: 0;
`;
