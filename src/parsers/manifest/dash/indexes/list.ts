/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import log from "../../../../log";
import {
  IRepresentationIndex,
  ISegment,
} from "../../../../manifest";
import { createIndexURL } from "../helpers";
import {
  getInitSegment,
  normalizeRange,
} from "./helpers";

export interface IListIndex {
  timescale: number;
  duration : number;
  list: Array<{
    mediaURL : string;
    mediaRange? : [number, number];
  }>;

  initialization?: { mediaURL: string; range?: [number, number] };
  indexRange?: [number, number];
  presentationTimeOffset? : number;
}

export interface IListIndexIndexArgument {
  duration : number;
  list: Array<{
    media? : string;
    mediaRange? : [number, number];
  }>;
  timescale : number;

  indexRange?: [number, number];
  initialization?: { media? : string; range?: [number, number] };
  presentationTimeOffset?: number;
}

export interface IListIndexContextArgument {
  periodStart : number;
  representationURL : string;
  representationId? : string;
  representationBitrate? : number;
}

/**
 * Provide helpers for SegmentList-based DASH indexes.
 * @type {Object}
 */
export default class ListRepresentationIndex implements IRepresentationIndex {
  private _index : IListIndex;

  /**
   * @param {Object} index
   * @param {Object} context
   */
  constructor(index : IListIndexIndexArgument, context : IListIndexContextArgument) {
    const {
      representationURL,
      representationId,
      representationBitrate,
    } = context;

    this._index = {
      list: index.list.map((lItem) => ({
        mediaURL: createIndexURL(
          representationURL,
          lItem.media,
          representationId,
          representationBitrate
        ),
        mediaRange: lItem.mediaRange,
      })),
      timescale: index.timescale,
      duration: index.duration,
      indexRange: index.indexRange,
      initialization: index.initialization && {
        mediaURL: createIndexURL(
          representationURL,
          index.initialization.media,
          representationId,
          representationBitrate
        ),
        range: index.initialization.range,
      },
    };
  }

  /**
   * Construct init Segment.
   * @returns {Object}
   */
  getInitSegment() : ISegment {
    return getInitSegment(this._index);
  }

  /**
   * @param {Number} _up
   * @param {Number} _to
   * @returns {Array.<Object>}
   */
  getSegments(_up : number, _to : number) : ISegment[] {
    const index = this._index;
    const { up, to } = normalizeRange(index, _up, _to);

    const { duration, list, timescale } = index;
    const length = Math.min(list.length - 1, Math.floor(to / duration));
    const segments : ISegment[] = [];
    let i = Math.floor(up / duration);
    while (i <= length) {
      const range = list[i].mediaRange;
      const mediaURL = list[i].mediaURL;
      const args = {
        id: "" + i,
        time: i * duration,
        isInit: false,
        range,
        duration,
        timescale,
        mediaURL,
      };
      segments.push(args);
      i++;
    }
    return segments;
  }

  /**
   * Returns true if, based on the arguments, the index should be refreshed.
   * (If we should re-fetch the manifest)
   * @param {Number} up
   * @param {Number} to
   * @returns {Boolean}
   */
  shouldRefresh(_up : number, to : number) : boolean {
    const {
      timescale,
      duration,
      list,
    } = this._index;

    const scaledTo = to * timescale;
    const i = Math.floor(scaledTo / duration);
    return !(i >= 0 && i < list.length);
  }

  /**
   * Returns first position in index.
   * @returns {Number}
   */
  getFirstPosition() : number {
    return 0;
  }

  /**
   * Returns last position in index.
   * @returns {Number}
   */
  getLastPosition() : number {
    const index = this._index;
    const { duration, list } = index;
    return (list.length * duration) / index.timescale;
  }

  /**
   * We do not check for discontinuity in SegmentList-based indexes.
   * @returns {Number}
   */
  checkDiscontinuity() : -1 {
    return -1;
  }

  /**
   * @param {Object} newIndex
   */
  _update(newIndex : ListRepresentationIndex) : void {
    this._index = newIndex._index;
  }

  /**
   * We do not have to add new segments to SegmentList-based indexes.
   * @returns {Array}
   */
  _addSegments() : void {
    if (__DEV__) {
      log.warn("Tried to add Segments to a list RepresentationIndex");
    }
  }
}
