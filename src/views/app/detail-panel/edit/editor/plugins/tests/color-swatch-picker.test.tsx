/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { fireEvent } from '@testing-library/react';

import { ColorSwatchPicker } from '../color-swatch-picker';
import { setupTest, screen } from '@test-setup';

describe('ColorSwatchPicker', () => {
	it('renders the hex input, preset swatches and gradient/hue sliders', () => {
		setupTest(<ColorSwatchPicker color="#000000" onChange={vi.fn()} onColorCommit={vi.fn()} />);

		expect(screen.getByTestId('color-swatch-picker-hex-input')).toBeVisible();
		expect(screen.getByTestId('color-swatch-black')).toBeVisible();
		expect(screen.getByTestId('color-swatch-orange')).toBeVisible();
		expect(screen.getAllByRole('slider')).toHaveLength(2);
	});

	it('calls onChange and onColorCommit with the clicked preset swatch color', async () => {
		const onChange = vi.fn();
		const onColorCommit = vi.fn();
		const { user } = setupTest(
			<ColorSwatchPicker color="#000000" onChange={onChange} onColorCommit={onColorCommit} />
		);

		await user.click(screen.getByTestId('color-swatch-red'));

		expect(onChange).toHaveBeenCalledWith('#ef5350');
		// Picking a preset swatch is a discrete choice, so the host popover
		// should close right away and hand focus back to the editor.
		expect(onColorCommit).toHaveBeenCalled();
	});

	it('calls onChange with the typed hex value, without closing the picker', async () => {
		const onChange = vi.fn();
		const onColorCommit = vi.fn();
		const { user } = setupTest(
			<ColorSwatchPicker color="#000000" onChange={onChange} onColorCommit={onColorCommit} />
		);
		const hexInput = screen.getByTestId('color-swatch-picker-hex-input');

		await user.clear(hexInput);
		await user.type(hexInput, 'ff0000');

		expect(onChange).toHaveBeenLastCalledWith('#ff0000');
		expect(onColorCommit).not.toHaveBeenCalled();
	});

	it('calls onColorCommit once a drag on the saturation square ends, but not while it is still in progress', async () => {
		const onColorCommit = vi.fn();
		const { user } = setupTest(
			<ColorSwatchPicker color="#000000" onChange={vi.fn()} onColorCommit={onColorCommit} />
		);
		// react-colorful renders the saturation square before the hue strip.
		const saturationSquare = screen.getAllByRole('slider')[0];

		await user.pointer({ keys: '[MouseLeft>]', target: saturationSquare });
		expect(onColorCommit).not.toHaveBeenCalled();

		// A drag regularly ends with the pointer outside the slider's own
		// bounds, so the completing release is targeted at `document.body`
		// rather than at the slider itself.
		await user.pointer({ keys: '[/MouseLeft]', target: document.body });
		expect(onColorCommit).toHaveBeenCalledTimes(1);
	});

	it('never calls onColorCommit for interacting with the hue strip alone', async () => {
		// Hue only rotates which column of the saturation square is available;
		// it isn't a complete color choice by itself, so the picker must stay
		// open until the user actually picks a shade in the square.
		const onColorCommit = vi.fn();
		const { user } = setupTest(
			<ColorSwatchPicker color="#000000" onChange={vi.fn()} onColorCommit={onColorCommit} />
		);
		const hueStrip = screen.getAllByRole('slider')[1];

		await user.pointer({ keys: '[MouseLeft>]', target: hueStrip });
		await user.pointer({ keys: '[/MouseLeft]', target: document.body });

		expect(onColorCommit).not.toHaveBeenCalled();
	});

	it('does not call onColorCommit for a mouseup that was not preceded by a gradient/hue mousedown', () => {
		const onColorCommit = vi.fn();
		setupTest(
			<ColorSwatchPicker color="#000000" onChange={vi.fn()} onColorCommit={onColorCommit} />
		);

		// Asserts the negative case directly: a stray mouseup elsewhere on the
		// page (no matching press on the sliders) must not be mistaken for a
		// finished drag. `user-event`'s pointer model requires a prior press to
		// release, so this specific "raw event with no press" case is
		// dispatched directly.
		// eslint-disable-next-line testing-library/prefer-user-event -- see comment above
		fireEvent.mouseUp(document);

		expect(onColorCommit).not.toHaveBeenCalled();
	});

	it('updates the displayed hex value when the color prop changes', () => {
		const { rerender } = setupTest(
			<ColorSwatchPicker color="#000000" onChange={vi.fn()} onColorCommit={vi.fn()} />
		);

		rerender(<ColorSwatchPicker color="#ff0000" onChange={vi.fn()} onColorCommit={vi.fn()} />);

		expect(screen.getByTestId('color-swatch-picker-hex-input')).toHaveValue('#ff0000');
	});

	it('falls back to black when no color is set', () => {
		setupTest(<ColorSwatchPicker color="" onChange={vi.fn()} onColorCommit={vi.fn()} />);

		expect(screen.getByTestId('color-swatch-picker-hex-input')).toHaveValue('#000000');
	});
});
