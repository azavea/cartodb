# encoding: utf-8

module CartoDB
  module Synchronizer
    class Member
      def initialize(attributes={})
        @attributes = attributes
      end

      def run
        puts "running"
        self
      end

      attr_reader :attributes
    end # Member
  end # Synchronizer
end # CartoDB

