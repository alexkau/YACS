// Generated by CoffeeScript 1.3.1
(function() {
  var conflict_runner, courses, create_summaries, has_initialized, initialize_validator, selection, templates, validator, visualize_conflicts;

  if ($('.content').length === 0) {
    return;
  }

  create_summaries = function() {
    var elements;
    elements = $('.summarize').not('.has-summary');
    summarize(elements, {
      summary_length: 150
    });
    return elements.addClass('has-summary');
  };

  $(function() {
    return create_summaries();
  });

  templates = null;

  $(function() {
    return window.templates = templates = find_templates();
  });

  $(function() {
    var spinner;
    spinner = $('#search-spinner');
    return updateform('#searchform', {
      start: function() {
        return spinner.show();
      },
      update: function(html) {
        $('#replacable-with-search').html(html);
        return create_summaries();
      },
      error: function() {
        return spinner.fadeOut();
      }
    });
  });

  courses = null;

  window.validator = validator = new Validator();

  has_initialized = false;

  initialize_validator = function() {
    var callback;
    if (has_initialized) {
      return;
    }
    $('input[type=checkbox]').attr('disabled', 'disabled');
    callback = barrier(3, function() {
      has_initialized = true;
      $('input[type=checkbox]').removeAttr('disabled');
      return $(validator).trigger('load');
    });
    api.courses(function(data) {
      courses = data;
      return callback();
    });
    api.conflicts(function(conflicts) {
      validator.set_conflicts(conflicts);
      return callback();
    });
    return api.sections(function(sections) {
      validator.set_sections(sections);
      return callback();
    });
  };

  conflict_runner = null;

  visualize_conflicts = function() {
    if (conflict_runner != null) {
      conflict_runner.abort();
    }
    return conflict_runner = iterate($('.course > input[type=checkbox]'), {
      each: function(element, i) {
        var cid, conflicted_sections, course, course_id, el, name, s, sec2course, section, section_id, section_ids, _i, _j, _len, _len1, _results;
        el = $(element);
        course_id = parseInt(el.attr('data-cid'), 10);
        section_ids = array_of_ints(el.attr('data-sids'));
        conflicted_sections = [];
        s = selection.copy();
        validator.set_data(s.data);
        sec2course = {};
        for (_i = 0, _len = section_ids.length; _i < _len; _i++) {
          section_id = section_ids[_i];
          cid = validator.conflicts_with(section_id);
          if (cid != null) {
            conflicted_sections.push(section_id);
            sec2course[section_id] = cid;
          } else {
            s.add_section(course_id, section_id);
            validator.set_data(s.data);
            if (!validator.is_valid()) {
              conflicted_sections.push(section_id);
            }
            s.undo();
          }
        }
        course = $('#course_' + course_id).parent().removeClass('conflict');
        course.find('.conflict').removeClass('conflict');
        course.find('.conflicts_with_course, .conflicts_with_section').remove();
        course.find('input[type=checkbox]').removeAttr('disabled');
        if (conflicted_sections.length === section_ids.length) {
          if ($('#course_' + course_id).checked()) {
            return;
          }
          course.addClass('conflict');
          if (sec2course[conflicted_sections[0]] != null) {
            name = courses.get(sec2course[conflicted_sections[0]]).get('name');
          } else {
            name = 'selection';
          }
          course.append(templates.conflict_template({
            classname: 'conflicts_with_course',
            name: name
          }));
          return course.find('input[type=checkbox]').attr('disabled', 'disabled');
        } else {
          _results = [];
          for (_j = 0, _len1 = conflicted_sections.length; _j < _len1; _j++) {
            section_id = conflicted_sections[_j];
            if ($('#section_' + section_id).checked()) {
              continue;
            }
            section = $('#section_' + section_id).attr('disabled', 'disabled');
            section = section.parent().addClass('conflict');
            if (sec2course[conflicted_sections[0]] != null) {
              name = courses.get(sec2course[section_id]).get('name');
            } else {
              name = 'selection';
            }
            _results.push(section.find('label').append(templates.conflict_template({
              classname: 'conflicts_with_section',
              name: name
            })));
          }
          return _results;
        }
      },
      end: function() {
        return conflict_runner = null;
      }
    });
  };

  $(validator).bind('load', function() {
    return visualize_conflicts();
  });

  window.selection = selection = new Selection().load();

  $(function() {
    var cid, sid, _i, _len, _ref, _results;
    _ref = selection.get_courses();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cid = _ref[_i];
      $('#course_' + cid).checked(true);
      _results.push((function() {
        var _j, _len1, _ref1, _results1;
        _ref1 = selection.get(cid);
        _results1 = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          sid = _ref1[_j];
          _results1.push($('#section_' + sid).checked(true));
        }
        return _results1;
      })());
    }
    return _results;
  });

  $(function() {
    var that;
    if (selection.has_courses()) {
      initialize_validator();
    } else if ($('input[type=checkbox]').length) {
      initialize_validator();
    }
    that = this;
    $('.course > input[type=checkbox]').click(function() {
      var course_id, el, free_section_ids, full_section_ids, is_checked, parent, section_id, section_ids, sections, valid_sections, _i, _j, _k, _len, _len1, _len2;
      el = $(this);
      is_checked = el.checked();
      course_id = parseInt(el.attr('data-cid'), 10);
      section_ids = array_of_ints(el.attr('data-sids'));
      full_section_ids = array_of_ints(el.attr('data-sids-full'));
      free_section_ids = _.difference(section_ids, full_section_ids);
      parent = el.parent();
      sections = (free_section_ids.length ? free_section_ids : section_ids);
      if (is_checked) {
        valid_sections = [];
        for (_i = 0, _len = sections.length; _i < _len; _i++) {
          section_id = sections[_i];
          validator.set_data(selection.data);
          if (!validator.conflicts_with(section_id)) {
            selection.add_section(course_id, section_id);
            validator.set_data(selection.data);
            if (!validator.is_valid(section_ids)) {
              console.log('undo', section_id);
              selection.undo();
            } else {
              console.log('add', section_id);
              valid_sections.push(section_id);
            }
          } else {
            console.log('obvious conflict', section_id);
          }
        }
        for (_j = 0, _len1 = valid_sections.length; _j < _len1; _j++) {
          section_id = valid_sections[_j];
          parent.find('#section_' + section_id).checked(is_checked);
        }
        if (valid_sections.length === 0) {
          el.checked(false);
          return false;
        }
      } else {
        validator.set_data(selection.data);
        selection.remove_course(course_id, section_ids);
        for (_k = 0, _len2 = sections.length; _k < _len2; _k++) {
          section_id = sections[_k];
          parent.find('#section_' + section_id).checked(is_checked);
        }
      }
      visualize_conflicts();
      return selection.save();
    });
    return $('.section > input[type=checkbox]').click(function() {
      var checked_courses, course_id, el, is_checked, parent, section_id;
      el = $(this);
      is_checked = el.checked();
      course_id = parseInt(el.attr('data-cid'), 10);
      section_id = parseInt(el.attr('data-sid'), 10);
      validator.set_data(selection.data);
      if (validator.conflicts_with(section_id)) {
        console.log('obvious conflict');
        return false;
      }
      if (is_checked) {
        selection.add_section(course_id, section_id);
      } else {
        selection.remove_section(course_id, section_id);
      }
      validator.set_data(selection.data);
      if (!validator.is_valid()) {
        selection.undo();
        console.log('deep conflict!');
        return false;
      }
      parent = el.parents('.course');
      checked_courses = false;
      parent.find('.section > input[type=checkbox]').each(function() {
        if ($(this).checked() === true) {
          return checked_courses = true;
        }
      });
      if (!checked_courses || is_checked) {
        parent.find('> input[type=checkbox]').checked(is_checked);
      }
      visualize_conflicts();
      return selection.save();
    });
  });

  $(function() {
    var callback, departments, sections, target;
    target = $('#selected_courses');
    if (!target.length) {
      return;
    }
    if (selection.has_courses()) {
      sections = null;
      departments = null;
      courses = null;
      callback = barrier(3, function() {
        var course, course_id, days_of_the_week, section, _i, _j, _len, _len1, _ref, _ref1;
        target.empty();
        _ref = selection.get_courses();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          course_id = _ref[_i];
          course = courses.get(course_id).to_hash();
          course.sections = (function() {
            var results;
            results = _.filter(sections.to_array(), function(s) {
              return s.get('course_id') === course.id;
            });
            return _.map(results, function(s) {
              return s.to_hash();
            });
          })();
          _ref1 = course.sections;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            section = _ref1[_j];
            section.instructors = (function() {
              return _.pluck(section.section_times, 'instructor');
            })();
            section.seats_left = section.seats_total - section.seats_taken;
          }
          course.section_ids = (function() {
            return _.pluck(course.sections, 'id');
          })();
          course.full_section_ids = (function() {
            return _.pluck(_.filter(course.sections, function(s) {
              return s.seats_taken >= s.seats_total;
            }), 'id');
          })();
          course.seats_total = (function() {
            return _.reduce(course.sections, (function(accum, item) {
              return accum + item.seats_total;
            }), 0);
          })();
          course.seats_taken = (function() {
            return _.reduce(course.sections, (function(accum, item) {
              return accum + item.seats_left;
            }), 0);
          })();
          course.seats_left = course.seats_total - course.seats_left;
          course.department = (function() {
            return departments.get(course.department_id).to_hash();
          })();
          course.instructors = (function() {
            var kinds, section, times, _k, _l, _len2, _len3, _ref2, _ref3;
            kinds = [];
            _ref2 = course.sections;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              section = _ref2[_k];
              _ref3 = section.section_times;
              for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                times = _ref3[_l];
                pushUnique(kinds, times.instructor);
              }
            }
            return kinds;
          })();
          course.kinds = (function() {
            var kinds, section, times, _k, _l, _len2, _len3, _ref2, _ref3;
            kinds = [];
            _ref2 = course.sections;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              section = _ref2[_k];
              _ref3 = section.section_times;
              for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                times = _ref3[_l];
                pushUnique(kinds, times.kind);
              }
            }
            return kinds;
          })();
          course.notes = (function() {
            return _.pluck(course.sections, 'notes');
          })();
          days_of_the_week = 'Monday Tuesday Wednesday Thursday Friday'.split(' ');
          target.append(templates.course_template({
            course: course,
            days_of_the_week: days_of_the_week,
            _: _,
            alwaysShowSections: true,
            isReadOnly: false,
            isSelectedSection: function(section_id) {
              return _.include(selection.get_sections(), section_id);
            },
            displayPeriod: function() {},
            periodsByDayOfWeek: function(periods) {
              var dow, period, remapped_periods, _k, _l, _len2, _len3, _len4, _m, _ref2;
              remapped_periods = {};
              for (_k = 0, _len2 = days_of_the_week.length; _k < _len2; _k++) {
                dow = days_of_the_week[_k];
                remapped_periods[dow] = [];
              }
              for (_l = 0, _len3 = periods.length; _l < _len3; _l++) {
                period = periods[_l];
                _ref2 = period.days_of_the_week;
                for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
                  dow = _ref2[_m];
                  remapped_periods[dow].push(period);
                }
              }
              return remapped_periods;
            },
            displayTime: function(period) {
              var end, fmt, start, time_fmt;
              fmt = '{{ 0 }}-{{ 1 }}';
              start = Time.parse_military(period.start);
              end = Time.parse_military(period.end);
              time_fmt = '{{ hour }}{{ sep_if_min }}{{ zmin_if_min }}';
              return format(fmt, start.format(time_fmt + ((start.isAM() === end.isAM()) || (start.isPM() === end.isPM()) ? '' : '{{ apm }}')), end.format(time_fmt + '{{ apm }}'));
            },
            pluralize: function(text, number, pluralize_text) {
              if (pluralize_text == null) {
                pluralize_text = 's';
              }
              if (number !== 1) {
                return text + pluralize_text;
              } else {
                return text;
              }
            }
          }));
        }
        return create_summaries('.summarize');
      });
      api.courses(function(data) {
        courses = data;
        return callback();
      });
      api.sections(function(data) {
        sections = data;
        return callback();
      });
      return api.departments(function(data) {
        departments = data;
        return callback();
      });
    } else {
      return target.html(templates.no_courses_template());
    }
  });

}).call(this);
